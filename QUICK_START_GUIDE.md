# Quick Start Guide - Troubleshooting Fixed

## 🔧 PostgreSQL 17.5 Compatibility Issue - RESOLVED

The Flyway compatibility issue with PostgreSQL 17.5 has been fixed with the following changes:

### ✅ Changes Made:

1. **Updated Flyway version** to 10.21.0 in `pom.xml`
2. **Added PostgreSQL-specific Flyway database dependency**
3. **Enhanced Flyway configuration** for better PostgreSQL 17.5 support
4. **Created development profile** with fallback options

## 🚀 Start Options

### Option 1: Using Updated Flyway (Recommended)
```bash
# 1. Clean and rebuild with new dependencies
cd backend
./mvnw clean install

# 2. Start the application
./mvnw spring-boot:run
```

### Option 2: Development Mode (Fallback)
If Flyway still has issues, use the development profile:

```bash
cd backend
./mvnw spring-boot:run -Dspring.profiles.active=dev
```

This will:
- Use `create-drop` instead of Flyway
- Auto-create database schema from JPA entities
- Skip migration validation

## 🔍 Testing the Fix

### 1. Check Application Startup
```bash
# Look for these success indicators in the logs:
# - "Started MemailApplication in X.XXX seconds"
# - No more "Unsupported Database: PostgreSQL 17.5" errors
# - Database connection successful
```

### 2. Test Database Connection
```bash
# Test health endpoint
curl http://localhost:8585/api/actuator/health

# Expected response:
# {"status":"UP"}
```

### 3. Test Authentication Endpoint
```bash
# Test login endpoint availability
curl -X POST http://localhost:8585/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@localhost","password":"test123"}'

# Expected: Either login success or authentication failure (not connection errors)
```

## 📝 Key Configuration Changes

### pom.xml Updates:
- **Flyway version**: 10.21.0 (supports PostgreSQL 17.5)
- **Added**: `flyway-database-postgresql` dependency
- **Updated**: Flyway Maven plugin configuration

### application.properties Updates:
- **Enhanced Flyway settings** for better compatibility
- **Baseline migration** enabled
- **Validation relaxed** for development

## 🎯 Next Steps

Once the application starts successfully:

1. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

2. **Access Application**:
   - Frontend: http://localhost:4545
   - Backend API: http://localhost:8585/api

3. **Test Login**:
   - Use Apache James credentials
   - Default test user: `test@localhost` / `password123`

## 🆘 If Issues Persist

If you still encounter PostgreSQL compatibility issues:

1. **Use development mode**:
   ```bash
   ./mvnw spring-boot:run -Dspring.profiles.active=dev
   ```

2. **Check PostgreSQL version**:
   ```bash
   docker exec -it memail-postgres-dev psql -U memail -d memail -c "SELECT version();"
   ```

3. **Consider downgrading PostgreSQL** in docker-compose.dev.yml:
   ```yaml
   postgres:
     image: postgres:15  # Instead of latest
   ```

The application should now start successfully! 🎉