# Apache James Docker Configuration

## Current Configuration

Based on your Apache James Docker logs, the mail server is configured with:

### IMAP Services
- **Standard IMAP**: `localhost:143` (STARTTLS enabled)
- **IMAP with SSL**: `localhost:993` (SSL enabled)

### SMTP Services
- **Standard SMTP**: `localhost:25`
- **SMTP with SSL**: `localhost:465` (SSL enabled)
- **SMTP with STARTTLS**: `localhost:587` (STARTTLS enabled) ✅ **Used by backend**

### Web Administration
- **WebAdmin**: `localhost:8000`

## Backend Configuration

Your Memail backend is configured to connect to:
```properties
# IMAP Connection (for authentication and reading emails)
mail.imap.host=localhost
mail.imap.port=143
mail.imap.ssl.enable=false
mail.imap.starttls.enable=true

# SMTP Connection (for sending emails)
mail.smtp.host=localhost
mail.smtp.port=587
mail.smtp.ssl.enable=false
mail.smtp.starttls.enable=true

# WebAdmin (for management operations)
james.webadmin.host=localhost
james.webadmin.port=8000
```

## Test Users

From your Apache James logs, I can see that test users were created. To test the application, you can:

### Option 1: Use existing test users
If your Docker setup created default users, try common test credentials like:
- `test@localhost` / `password123`
- `user1@localhost` / `password`
- `admin@localhost` / `admin`

### Option 2: Create new users via WebAdmin
You can create users using the WebAdmin API:

```bash
# Create a domain (if not exists)
curl -X PUT http://localhost:8000/domains/localhost

# Create a user
curl -X PUT http://localhost:8000/users/test@localhost \
  -H "Content-Type: application/json" \
  -d '{"password":"password123"}'

# Verify user exists
curl http://localhost:8000/users
```

### Option 3: Check Docker logs for created users
Look for "AddUser command executed successfully" entries in your logs to see what users were created.

## Testing Connection

To test your setup:

1. **Start Apache James Docker** (already running)
2. **Start PostgreSQL** for the backend database
3. **Start Memail Backend** on port 8585
4. **Start Memail Frontend** on port 4545

### Test Authentication
Use the login form with one of the test users to verify IMAP authentication works.

### Troubleshooting

If connection fails:
1. **Check Docker network**: Ensure James is accessible on localhost
2. **Verify ports**: Use `netstat -an | grep :143` to confirm IMAP is listening
3. **Check logs**: Both James logs and Spring Boot logs for connection errors
4. **Test manual connection**: Use telnet or IMAP client to test direct connection

```bash
# Test IMAP connection
telnet localhost 143

# Expected response:
# * OK JAMES IMAP4rev1 Server b5ed63726a2d is ready.
```

## Security Notes

- **STARTTLS**: Enabled for secure communication over plain ports
- **SSL/TLS**: Available on dedicated secure ports (993, 465)
- **Authentication**: Required for all IMAP/SMTP operations
- **Localhost only**: James is bound to localhost (secure for development)

Your current configuration is **optimal for development** with STARTTLS for secure authentication over standard ports.