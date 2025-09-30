# Port Configuration

This document outlines the port configuration for the Memail application.

## 🔧 Configured Ports

### Backend (Spring Boot)
- **Port**: `8585`
- **URL**: `http://localhost:8585/api`
- **Configuration**: `/backend/src/main/resources/application.yml`

```yaml
server:
  port: 8585
  servlet:
    context-path: /api
```

### Frontend (Angular)
- **Port**: `4545`
- **URL**: `http://localhost:4545`
- **Configuration**: `/frontend/angular.json`

```json
"serve": {
  "options": {
    "port": 4545
  },
  "builder": "@angular/build:dev-server",
  ...
}
```

### Environment Configuration
Frontend environment files have been updated:

**Development** (`/frontend/src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8585/api',
  websocketUrl: 'ws://localhost:8585/api/ws',
  appName: 'Memail',
  version: '1.0.0'
};
```

**Production** (`/frontend/src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.memail.com/api',
  websocketUrl: 'wss://api.memail.com/api/ws',
  appName: 'Memail',
  version: '1.0.0'
};
```

## 🚀 Starting the Application

### 1. Start Backend
```bash
cd backend
./mvnw spring-boot:run
```
Backend will be available at: `http://localhost:8585/api`

### 2. Start Frontend
```bash
cd frontend
npm install
npm start
```
Frontend will be available at: `http://localhost:4545`

### 3. Using Docker Compose
All services (PostgreSQL, Apache James, etc.) remain on their standard ports:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## 🔍 Port Verification

### Check if ports are available:
```bash
# Windows
netstat -an | findstr :8585
netstat -an | findstr :4545

# Linux/macOS
netstat -an | grep :8585
netstat -an | grep :4545
```

### Test connectivity:
```bash
# Test backend health
curl http://localhost:8585/api/actuator/health

# Test frontend (after starting)
curl http://localhost:4545
```

## 📝 Updated Files

The following files have been updated with the new port configuration:

1. ✅ `/backend/src/main/resources/application.yml` - Backend port and CORS
2. ✅ `/frontend/angular.json` - Angular dev server port
3. ✅ `/frontend/src/environments/environment.ts` - Development API URL
4. ✅ `/frontend/src/environments/environment.prod.ts` - Production API URL
5. ✅ `/README.md` - Updated quick start instructions
6. ✅ `/docs/setup/DEVELOPMENT.md` - Updated development guide
7. ✅ `/docs/COMPREHENSIVE_DEVELOPMENT_PLAN.md` - Updated implementation plan

All cross-references and documentation have been updated to reflect the new port configuration.