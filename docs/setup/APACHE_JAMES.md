# Apache James Setup Guide

This guide will help you set up Apache James email server for use with the Memail application.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation Methods](#installation-methods)
- [Docker Setup (Recommended)](#docker-setup-recommended)
- [Manual Installation](#manual-installation)
- [Configuration](#configuration)
- [User Management](#user-management)
- [Testing the Setup](#testing-the-setup)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Apache James is a 100% pure Java SMTP and POP3 Mail server and NNTP News server. It's designed to be a complete and portable enterprise mail engine solution based on currently available open protocols.

For Memail, we need James configured with:
- IMAP server for email retrieval
- SMTP server for email sending
- User authentication
- Mailbox management

## 🛠️ Installation Methods

### Option 1: Docker Setup (Recommended)

This is the fastest way to get Apache James running for development.

#### Prerequisites
- Docker installed on your system
- Docker Compose (usually included with Docker)

#### Step 1: Create Docker Compose Configuration

Create a file named `docker-compose-james.yml` in your project root:

```yaml
version: '3.8'

services:
  james:
    image: apache/james:cassandra-3.8.0
    hostname: james.local
    container_name: memail-james
    ports:
      - "25:25"     # SMTP
      - "465:465"   # SMTPS
      - "587:587"   # SMTP with STARTTLS
      - "143:143"   # IMAP
      - "993:993"   # IMAPS
      - "110:110"   # POP3
      - "995:995"   # POP3S
      - "8000:8000" # WebAdmin
    environment:
      - JAMES_CASSANDRA_REPLICATION_FACTOR=1
    volumes:
      - james-data:/root/conf
      - ./james-config:/root/conf/custom
    depends_on:
      - cassandra
      - elasticsearch

  cassandra:
    image: cassandra:3.11.14
    container_name: memail-cassandra
    ports:
      - "9042:9042"
    environment:
      - CASSANDRA_DC=datacenter1
      - CASSANDRA_CLUSTER_NAME=james
    volumes:
      - cassandra-data:/var/lib/cassandra

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.8
    container_name: memail-elasticsearch
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

volumes:
  james-data:
  cassandra-data:
  elasticsearch-data:
```

#### Step 2: Create James Configuration Directory

```bash
mkdir -p james-config
```

#### Step 3: Create Basic James Configuration

Create `james-config/imapserver.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<imapserver enabled="true">
    <jmxName>imapserver</jmxName>
    <bind>0.0.0.0:143</bind>
    <connectionBacklog>200</connectionBacklog>
    <tls socketTLS="false" startTLS="true">
        <keystore>file://conf/keystore</keystore>
        <secret>james72laBalle</secret>
    </tls>
    <connectionLimit>0</connectionLimit>
    <connectionLimitPerIP>0</connectionLimitPerIP>
    <plainAuthDisallowed>false</plainAuthDisallowed>
    <timeout>1800</timeout>
    <enableIdle>true</enableIdle>
    <idleTimeInterval>120</idleTimeInterval>
    <idleTimeResolution>10</idleTimeResolution>
    <literalSizeLimit>0</literalSizeLimit>
    <auth>
        <requireSSL>false</requireSSL>
        <plainAuthEnabled>true</plainAuthEnabled>
    </auth>
</imapserver>
```

Create `james-config/smtpserver.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<smtpserver enabled="true">
    <jmxName>smtpserver</jmxName>
    <bind>0.0.0.0:25</bind>
    <connectionBacklog>200</connectionBacklog>
    <tls socketTLS="false" startTLS="true">
        <keystore>file://conf/keystore</keystore>
        <secret>james72laBalle</secret>
    </tls>
    <connectiontimeout>360</connectiontimeout>
    <connectionLimit>0</connectionLimit>
    <connectionLimitPerIP>0</connectionLimitPerIP>
    <authRequired>false</authRequired>
    <authorizedAddresses>127.0.0.0/8,::1</authorizedAddresses>
    <verifyIdentity>true</verifyIdentity>
    <maxmessagesize>0</maxmessagesize>
    <addressBracketsEnforcement>true</addressBracketsEnforcement>
    <handlerchain>
        <handler class="org.apache.james.smtpserver.fastfail.ValidRcptHandler"/>
        <handler class="org.apache.james.smtpserver.CoreCmdHandlerLoader"/>
    </handlerchain>
</smtpserver>
```

#### Step 4: Start Apache James

```bash
docker-compose -f docker-compose-james.yml up -d
```

#### Step 5: Wait for Services to Start

```bash
# Check if services are running
docker-compose -f docker-compose-james.yml ps

# Check James logs
docker logs memail-james

# Wait for James to be fully started (this can take 2-3 minutes)
```

### Option 2: Manual Installation

#### Prerequisites
- Java 11 or higher
- At least 2GB RAM
- Apache Cassandra 3.11+
- Elasticsearch 7.x

#### Step 1: Download Apache James

```bash
# Download Apache James
wget https://downloads.apache.org/james/server/3.8.0/james-server-cassandra-app-3.8.0-app.zip

# Extract
unzip james-server-cassandra-app-3.8.0-app.zip
cd james-server-cassandra-app-3.8.0
```

#### Step 2: Install Dependencies

**Install Cassandra:**
```bash
# Ubuntu/Debian
echo "deb https://debian.cassandra.apache.org 311x main" | sudo tee -a /etc/apt/sources.list.d/cassandra.sources.list
curl https://downloads.apache.org/cassandra/KEYS | sudo apt-key add -
sudo apt-get update
sudo apt-get install cassandra

# Start Cassandra
sudo systemctl start cassandra
sudo systemctl enable cassandra
```

**Install Elasticsearch:**
```bash
# Ubuntu/Debian
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-7.x.list
sudo apt-get update
sudo apt-get install elasticsearch

# Start Elasticsearch
sudo systemctl start elasticsearch
sudo systemctl enable elasticsearch
```

#### Step 3: Configure James

Edit `conf/cassandra.properties`:
```properties
cassandra.nodes=127.0.0.1
cassandra.keyspace=apache_james
cassandra.replication.factor=1
```

Edit `conf/elasticsearch.properties`:
```properties
elasticsearch.masterHost=127.0.0.1
elasticsearch.port=9200
```

#### Step 4: Start James

```bash
# Make sure Cassandra and Elasticsearch are running
sudo systemctl status cassandra
sudo systemctl status elasticsearch

# Start James
./bin/james start
```

## ⚙️ Configuration

### WebAdmin Configuration

James provides a web-based administration interface. To enable it, create or edit `conf/webadmin.properties`:

```properties
enabled=true
port=8000
host=localhost
cors.enable=true
cors.origin=*
jwt.enable=false
```

### Domain Configuration

After James starts, you need to configure a domain:

```bash
# Add a domain (replace example.com with your domain)
curl -XPUT http://localhost:8000/domains/localhost

# Verify domain was added
curl -XGET http://localhost:8000/domains
```

## 👥 User Management

### Creating Users via WebAdmin API

```bash
# Create a user
curl -XPUT http://localhost:8000/users/test@localhost \
  -H "Content-Type: application/json" \
  -d '{"password":"password123"}'

# Create another user for testing
curl -XPUT http://localhost:8000/users/admin@localhost \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}'

# List all users
curl -XGET http://localhost:8000/users

# Change user password
curl -XPUT http://localhost:8000/users/test@localhost/password \
  -H "Content-Type: application/json" \
  -d '{"password":"newpassword123"}'
```

### Creating Users via James CLI

```bash
# If using Docker
docker exec -it memail-james james-cli AddUser test@localhost password123
docker exec -it memail-james james-cli AddUser admin@localhost admin123

# If using manual installation
./bin/james-cli AddUser test@localhost password123
./bin/james-cli AddUser admin@localhost admin123

# List users
./bin/james-cli ListUsers
```

## 🧪 Testing the Setup

### Test IMAP Connection

```bash
# Test IMAP connection using telnet
telnet localhost 143

# After connecting, you should see:
# * OK JAMES IMAP4rev1 Server

# Login (replace with your created user)
a001 LOGIN test@localhost password123

# List mailboxes
a002 LIST "" "*"

# Logout
a003 LOGOUT
```

### Test SMTP Connection

```bash
# Test SMTP connection
telnet localhost 25

# After connecting, you should see:
# 220 james.local SMTP Server ready

# Basic SMTP test
EHLO localhost
MAIL FROM: test@localhost
RCPT TO: admin@localhost
DATA
Subject: Test Email

This is a test email.
.
QUIT
```

### Test with Email Client

You can test with any email client using these settings:

**IMAP Settings:**
- Server: localhost
- Port: 143
- Security: STARTTLS
- Username: test@localhost
- Password: password123

**SMTP Settings:**
- Server: localhost
- Port: 587 (or 25)
- Security: STARTTLS
- Username: test@localhost
- Password: password123

## 🔧 Memail Application Configuration

Update your Memail backend configuration (`backend/src/main/resources/application.yml`):

```yaml
spring:
  mail:
    imap:
      host: localhost
      port: 143
      ssl: false
      starttls: true
    smtp:
      host: localhost
      port: 587
      ssl: false
      starttls: true
```

## 🐛 Troubleshooting

### Common Issues

#### James Won't Start
```bash
# Check if required services are running
docker ps  # for Docker setup
# or
sudo systemctl status cassandra elasticsearch  # for manual setup

# Check James logs
docker logs memail-james  # for Docker
# or
tail -f logs/james-server.log  # for manual setup
```

#### Can't Connect to IMAP/SMTP
```bash
# Check if ports are open
netstat -tlnp | grep -E '(143|25|587)'

# Test port connectivity
telnet localhost 143
telnet localhost 25
```

#### Authentication Failures
```bash
# Verify user exists
curl -XGET http://localhost:8000/users

# Reset user password
curl -XPUT http://localhost:8000/users/test@localhost/password \
  -H "Content-Type: application/json" \
  -d '{"password":"newpassword"}'
```

#### Performance Issues
- Increase JVM memory: `-Xmx2G -Xms1G`
- Check Cassandra and Elasticsearch health
- Monitor disk space and system resources

### Useful Commands

```bash
# Docker setup commands
docker-compose -f docker-compose-james.yml logs james
docker-compose -f docker-compose-james.yml restart james
docker-compose -f docker-compose-james.yml down -v  # Remove all data

# Manual setup commands
./bin/james stop
./bin/james start
tail -f logs/james-server.log

# WebAdmin API endpoints
curl -XGET http://localhost:8000/domains
curl -XGET http://localhost:8000/users
curl -XGET http://localhost:8000/mailboxes
curl -XGET http://localhost:8000/quota/users/test@localhost
```

## 📚 Additional Resources

- [Apache James Official Documentation](https://james.apache.org/server/index.html)
- [James WebAdmin API](https://james.apache.org/server/manage-webadmin.html)
- [James Configuration Guide](https://james.apache.org/server/config.html)
- [Troubleshooting Guide](https://james.apache.org/server/quick-start.html)

## 🚀 Production Considerations

For production deployment:

1. **Security**: Enable SSL/TLS for all connections
2. **Performance**: Use clustered Cassandra and Elasticsearch
3. **Backup**: Implement regular backup strategies
4. **Monitoring**: Set up monitoring and alerting
5. **DNS**: Configure proper MX records
6. **Firewall**: Secure network access

See the [Production Deployment Guide](../deployment/PRODUCTION.md) for detailed instructions.