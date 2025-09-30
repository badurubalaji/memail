# How to Check Your Apache James Docker Port Configuration

## Find Your James Docker Container Ports

### Method 1: Check Docker Container Ports
```bash
# List all Docker containers and their port mappings
docker ps

# Look for your James container and note the port mappings
# Example output might show:
# 0.0.0.0:9143->143/tcp, 0.0.0.0:9587->587/tcp, 0.0.0.0:9999->8000/tcp
```

### Method 2: Check Docker Compose Configuration
If you're using docker-compose, check your `docker-compose.yml` file:
```yaml
# Look for port mappings like:
ports:
  - "9143:143"    # IMAP
  - "9587:587"    # SMTP
  - "9999:8000"   # WebAdmin
```

### Method 3: Test James WebAdmin Directly
```bash
# Try different possible WebAdmin ports:
curl http://localhost:8000/     # Standard WebAdmin
curl http://localhost:9999/     # Alternative WebAdmin
curl http://localhost:9000/     # Another common mapping

# If any responds, you found the WebAdmin port
```

### Method 4: Check James Container Logs
```bash
# Get James container name/ID
docker ps | grep james

# Check logs for port bindings
docker logs <james-container-name-or-id> | grep "bound to"
```

## Update Memail Configuration

Once you find the correct ports, update the configuration:

### Option A: Use Docker Profile
```bash
# Start backend with Docker profile
cd backend
./mvnw spring-boot:run -Dspring.profiles.active=docker
```

### Option B: Update Main Configuration
Edit `backend/src/main/resources/application.properties`:
```properties
# Replace with your actual James ports
mail.imap.host=localhost
mail.imap.port=YOUR_IMAP_PORT    # e.g., 9143
mail.smtp.host=localhost
mail.smtp.port=YOUR_SMTP_PORT    # e.g., 9587
james.webadmin.host=localhost
james.webadmin.port=YOUR_WEBADMIN_PORT  # e.g., 9999
```

## Common James Docker Port Mappings

### Standard Mapping
```
Host -> Container
143  -> 143   (IMAP)
587  -> 587   (SMTP)
8000 -> 8000  (WebAdmin)
```

### Alternative Mapping (9xxx ports)
```
Host -> Container
9143 -> 143   (IMAP)
9587 -> 587   (SMTP)
9999 -> 8000  (WebAdmin)
```

### Single Port Mapping (if using proxy)
```
Host -> Container
9999 -> 8080  (All services via proxy)
```

## Test Your Configuration

### Test IMAP Connection
```bash
# Replace 9143 with your actual IMAP port
telnet localhost 9143
# Should respond with: * OK JAMES IMAP4rev1 Server
```

### Test WebAdmin
```bash
# Replace 9999 with your actual WebAdmin port
curl http://localhost:9999/
```

### Test from Memail Backend
Start your backend and watch the logs when trying to login:
```bash
cd backend
./mvnw spring-boot:run

# Look for connection logs like:
# "Connecting to IMAP server: localhost:9143 with user: test@localhost"
```

## Quick Test Commands

Run these to identify your James ports:
```bash
# Test common IMAP ports
for port in 143 993 9143 9993; do
  echo "Testing IMAP on port $port..."
  timeout 2 bash -c "</dev/tcp/localhost/$port" 2>/dev/null && echo "Port $port is open" || echo "Port $port is closed"
done

# Test common WebAdmin ports
for port in 8000 9000 9999; do
  echo "Testing WebAdmin on port $port..."
  curl -s --connect-timeout 2 http://localhost:$port/ >/dev/null 2>&1 && echo "WebAdmin responding on port $port" || echo "No WebAdmin on port $port"
done
```

Once you identify the correct ports, update the Memail configuration accordingly!