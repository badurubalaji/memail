# Development Environment Setup Guide

This guide will help you set up a complete development environment for the Memail application.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Development Tools Setup](#development-tools-setup)
- [Database Setup](#database-setup)
- [Email Server Setup](#email-server-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 📋 Prerequisites

Before starting, ensure you have the following installed:

### Required Software
- **Java Development Kit (JDK) 17+**
- **Node.js 18+** and **npm**
- **PostgreSQL 13+**
- **Docker** and **Docker Compose**
- **Git**

### Recommended IDEs
- **IntelliJ IDEA** (Ultimate or Community Edition)
- **Visual Studio Code** with Angular/Java extensions

## 💻 System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: 8GB (16GB recommended)
- **Storage**: 10GB free space
- **CPU**: Dual-core processor (Quad-core recommended)

### Recommended for Optimal Performance
- **RAM**: 16GB+
- **Storage**: SSD with 20GB+ free space
- **CPU**: Quad-core processor or better

## 🛠️ Development Tools Setup

### 1. Install Java Development Kit (JDK)

#### Windows
```bash
# Using Chocolatey
choco install openjdk17

# Or download from: https://adoptium.net/
# Set JAVA_HOME environment variable
```

#### macOS
```bash
# Using Homebrew
brew install openjdk@17

# Add to your shell profile (.zshrc or .bash_profile)
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install openjdk-17-jdk

# Verify installation
java -version
javac -version
```

### 2. Install Node.js and npm

#### Windows
```bash
# Using Chocolatey
choco install nodejs

# Or download from: https://nodejs.org/
```

#### macOS
```bash
# Using Homebrew
brew install node

# Or using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### Linux
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install Angular CLI

```bash
npm install -g @angular/cli@20
ng version
```

### 4. Install Docker

#### Windows
Download Docker Desktop from: https://www.docker.com/products/docker-desktop

#### macOS
```bash
# Using Homebrew
brew install --cask docker

# Or download Docker Desktop from: https://www.docker.com/products/docker-desktop
```

#### Linux (Ubuntu)
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## 🗄️ Database Setup

### Option 1: Using Docker (Recommended)

Create a `docker-compose.dev.yml` file in the project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: memail-postgres-dev
    environment:
      POSTGRES_DB: memail
      POSTGRES_USER: memail
      POSTGRES_PASSWORD: password
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8"
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    command: postgres -c 'max_connections=200'

  pgadmin:
    image: dpage/pgadmin4:7
    container_name: memail-pgadmin-dev
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@memail.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "8080:80"
    depends_on:
      - postgres

volumes:
  postgres-data:
```

Start the database:

```bash
docker-compose -f docker-compose.dev.yml up -d postgres
```

### Option 2: Local PostgreSQL Installation

#### Windows
```bash
# Using Chocolatey
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/
```

#### macOS
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database and user
createdb memail
createuser -s memail
```

#### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE memail;
CREATE USER memail WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE memail TO memail;
\q
```

## 📧 Email Server Setup

Follow the [Apache James Setup Guide](APACHE_JAMES.md) to set up the email server.

Quick Docker setup for development:

```bash
# Add to your docker-compose.dev.yml
  james:
    image: apache/james:cassandra-3.8.0
    container_name: memail-james-dev
    ports:
      - "25:25"     # SMTP
      - "587:587"   # SMTP with STARTTLS
      - "143:143"   # IMAP
      - "993:993"   # IMAPS
      - "8000:8000" # WebAdmin
    depends_on:
      - cassandra
      - elasticsearch

  cassandra:
    image: cassandra:3.11
    container_name: memail-cassandra-dev
    environment:
      - CASSANDRA_DC=datacenter1
      - CASSANDRA_CLUSTER_NAME=james

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.8
    container_name: memail-elasticsearch-dev
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
```

Start all services:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

## 🚀 Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Configure Application Properties

Create `src/main/resources/application-dev.yml`:

```yaml
spring:
  profiles:
    active: dev

  datasource:
    url: jdbc:postgresql://localhost:5432/memail
    username: memail
    password: password

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true

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

logging:
  level:
    com.memail: DEBUG
    org.springframework.web: DEBUG
    org.springframework.security: DEBUG

server:
  port: 8080
```

### 3. Build and Run

```bash
# Build the project
./mvnw clean compile

# Run database migrations
./mvnw flyway:migrate

# Start the application
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The backend will be available at: http://localhost:8585/api

### 4. Verify Backend is Running

```bash
# Health check
curl http://localhost:8585/api/actuator/health

# API documentation (if Swagger is configured)
# Open: http://localhost:8585/api/swagger-ui.html
```

## 🎨 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Additional Packages

```bash
# Angular Material
ng add @angular/material

# Other useful packages
npm install @angular/cdk @angular/flex-layout
npm install rxjs lodash date-fns
npm install quill ngx-quill  # Rich text editor
npm install @types/lodash --save-dev
```

### 4. Configure Environment

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8585/api',
  websocketUrl: 'ws://localhost:8585/api/ws',
  appName: 'Memail',
  version: '1.0.0'
};
```

### 5. Start Development Server

```bash
ng serve
```

The frontend will be available at: http://localhost:4545

### 6. Verify Frontend is Running

Open your browser and navigate to http://localhost:4545. You should see the Angular welcome page.

## 🔄 Development Workflow

### 1. Daily Development Setup

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# In one terminal - Start backend
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# In another terminal - Start frontend
cd frontend
ng serve
```

### 2. Code Structure Guidelines

#### Backend Structure
```
src/main/java/com/memail/
├── config/          # Configuration classes
├── controller/      # REST endpoints
├── service/         # Business logic
├── repository/      # Data access
├── model/          # JPA entities
├── dto/            # Data transfer objects
├── security/       # Security configuration
└── util/           # Utility classes
```

#### Frontend Structure
```
src/app/
├── core/           # Core services, guards, interceptors
├── shared/         # Shared components, pipes, directives
├── features/       # Feature modules
│   ├── auth/       # Authentication
│   ├── mail/       # Email functionality
│   ├── contacts/   # Contact management
│   └── settings/   # User settings
├── layout/         # Layout components
└── material/       # Angular Material configuration
```

### 3. Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
```

### 4. Code Style Guidelines

#### Backend (Java)
- Use Spring Boot conventions
- Follow Google Java Style Guide
- Use meaningful variable and method names
- Add Javadoc for public methods
- Write unit tests for services

#### Frontend (TypeScript/Angular)
- Follow Angular Style Guide
- Use TypeScript strict mode
- Implement OnPush change detection
- Use reactive programming (RxJS)
- Write unit tests for components and services

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=UserServiceTest

# Run integration tests
./mvnw verify
```

### Frontend Testing

```bash
cd frontend

# Run unit tests
npm test

# Run e2e tests
npm run e2e

# Run tests with coverage
npm run test:coverage
```

### API Testing

#### Using cURL

```bash
# Test authentication
curl -X POST http://localhost:8585/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@localhost","password":"password123"}'

# Test protected endpoint
curl -X GET http://localhost:8585/api/emails \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Using Postman

1. Import the Postman collection from `docs/api/postman-collection.json`
2. Set environment variables:
   - `baseUrl`: http://localhost:8585/api
   - `token`: (will be set automatically after login)

## 🐛 Troubleshooting

### Common Issues

#### Backend Won't Start

```bash
# Check Java version
java -version

# Check if port 8080 is in use
netstat -an | grep 8080  # Linux/macOS
netstat -an | findstr 8080  # Windows

# Check database connection
./mvnw flyway:info
```

#### Frontend Won't Start

```bash
# Check Node.js version
node --version
npm --version

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps  # for Docker setup
pg_ctl status  # for local installation

# Test database connection
psql -h localhost -U memail -d memail
```

#### Email Server Issues

```bash
# Check James container logs
docker logs memail-james-dev

# Test IMAP connection
telnet localhost 143

# Check WebAdmin API
curl http://localhost:8000/domains
```

### Development Tips

1. **Use Hot Reload**: Both Spring Boot DevTools and Angular CLI support hot reload
2. **Database GUI**: Use pgAdmin (http://localhost:8081) for database management
3. **API Documentation**: Consider adding Swagger/OpenAPI documentation
4. **Logging**: Use appropriate log levels for debugging
5. **Environment Variables**: Use different configurations for dev/test/prod

### Performance Optimization

#### Backend
- Enable Spring Boot DevTools for auto-restart
- Use connection pooling for database
- Implement caching where appropriate
- Optimize database queries

#### Frontend
- Use OnPush change detection strategy
- Implement lazy loading for modules
- Optimize bundle size with tree shaking
- Use trackBy functions in *ngFor loops

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Angular Documentation](https://angular.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Apache James Documentation](https://james.apache.org/server/)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with:
   - OS and version
   - Java and Node.js versions
   - Error messages and logs
   - Steps to reproduce the issue

## 🚀 Next Steps

After setting up your development environment:

1. Follow the [API Development Guide](../api/README.md)
2. Read the [Frontend Development Guide](../frontend/README.md)
3. Check out the [Testing Guide](../testing/README.md)
4. Review the [Deployment Guide](../deployment/README.md)