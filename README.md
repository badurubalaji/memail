# Memail - Modern Webmail Client

A modern, Gmail-inspired webmail client built with Angular 20 and Spring Boot 3.5.5, designed to work with Apache James email servers.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Apache James Setup](#apache-james-setup)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## 🎯 Overview

Memail is a feature-rich webmail client that provides a modern Gmail-like interface for Apache James email servers. It supports conversation threading, labels/tags, real-time notifications, and powerful search capabilities.

## ✨ Features

### Email Management
- **Conversation Threading**: Automatic grouping of related emails
- **Labels/Tags**: Organize emails with multiple labels instead of folders
- **Search**: Powerful search with filters (from, to, subject, date range)
- **Real-time Notifications**: WebSocket-based live updates
- **Attachments**: Full support for viewing and downloading attachments

### User Interface
- **Gmail-inspired Design**: Clean, modern, and intuitive interface
- **Responsive Layout**: Works seamlessly on desktop and mobile
- **Dark/Light Theme**: User-configurable themes
- **Keyboard Shortcuts**: Gmail-style keyboard navigation
- **Rich Text Composer**: WYSIWYG email editor with formatting

### Advanced Features
- **Bulk Actions**: Perform actions on multiple emails at once
- **Auto-advance**: Automatically move to next email after actions
- **Contact Management**: Built-in address book
- **User Preferences**: Customizable settings and preferences
- **Email Signatures**: Rich text email signatures

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Angular SPA   │    │  Spring Boot API │    │ Apache James    │
│                 │    │                  │    │ Email Server    │
│ • Gmail-like UI │◄──►│ • REST Gateway   │◄──►│                 │
│ • Real-time     │    │ • JWT Auth       │    │ • IMAP/SMTP     │
│ • Responsive    │    │ • IMAP Client    │    │ • Email Storage │
│                 │    │ • WebSocket      │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
         │              ┌──────────────────┐
         │              │   PostgreSQL     │
         └──────────────┤                  │
            (WebSocket) │ • User Prefs     │
                        │ • Labels/Tags    │
                        │ • Contacts       │
                        │ • Email Metadata │
                        └──────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Angular 20**: Modern TypeScript framework
- **Angular Material**: UI component library
- **RxJS**: Reactive programming
- **SCSS**: Advanced CSS preprocessing
- **Angular PWA**: Progressive Web App capabilities

### Backend
- **Spring Boot 3.5.5**: Java application framework
- **Spring Security**: Authentication and authorization
- **Spring Data JPA**: Data persistence layer
- **PostgreSQL**: Primary database
- **Jakarta Mail API**: Email protocol handling
- **JWT**: Token-based authentication
- **WebSocket**: Real-time communication

### Email Server
- **Apache James**: Open-source email server
- **IMAP**: Email retrieval protocol
- **SMTP**: Email sending protocol

## 📁 Project Structure

```
memail/
├── frontend/                 # Angular 20 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── pages/        # Main application pages
│   │   │   ├── services/     # Angular services
│   │   │   ├── guards/       # Route guards
│   │   │   ├── models/       # TypeScript interfaces
│   │   │   └── shared/       # Shared utilities
│   │   ├── assets/           # Static assets
│   │   └── environments/     # Environment configurations
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                  # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/memail/
│   │   │   │   ├── config/      # Configuration classes
│   │   │   │   ├── controller/  # REST controllers
│   │   │   │   ├── service/     # Business logic
│   │   │   │   ├── repository/  # Data access layer
│   │   │   │   ├── model/       # JPA entities
│   │   │   │   ├── dto/         # Data transfer objects
│   │   │   │   ├── security/    # Security configuration
│   │   │   │   ├── mail/        # Email handling
│   │   │   │   └── websocket/   # WebSocket handling
│   │   │   └── resources/
│   │   │       ├── db/migration/    # Flyway migrations
│   │   │       └── application.yml  # Application config
│   │   └── test/             # Test files
│   ├── pom.xml
│   └── README.md
│
├── docs/                     # Documentation
│   ├── api/                  # API documentation
│   ├── setup/                # Setup guides
│   └── deployment/           # Deployment guides
│
├── docker-compose.yml        # Development environment
├── README.md                 # This file
└── .gitignore
```

## 🚀 Quick Start

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- PostgreSQL 13 or higher
- Apache James server (see setup guide)

### 1. Clone and Setup Database

```bash
# Clone the repository
git clone <repository-url>
cd memail

# Start PostgreSQL (using Docker)
docker run --name memail-postgres \
  -e POSTGRES_DB=memail \
  -e POSTGRES_USER=memail \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

### 2. Start Backend

```bash
cd backend
./mvnw spring-boot:run
```

The backend will be available at `http://localhost:8585/api`

### 3. Start Frontend

```bash
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:4545`

## 🔧 Development Setup

For detailed development setup instructions, see [Development Setup Guide](docs/setup/DEVELOPMENT.md).

## 📧 Apache James Setup

For setting up Apache James email server, see [Apache James Setup Guide](docs/setup/APACHE_JAMES.md).

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Email Endpoints
- `GET /api/emails` - Get conversations (paginated)
- `GET /api/emails/{id}` - Get conversation details
- `POST /api/emails/send` - Send new email
- `POST /api/emails/actions` - Perform bulk actions
- `GET /api/emails/search` - Search emails

### Label Endpoints
- `GET /api/labels` - Get user labels
- `POST /api/labels` - Create new label
- `PUT /api/labels/{id}` - Update label
- `DELETE /api/labels/{id}` - Delete label

For complete API documentation, see [API Reference](docs/api/README.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the [documentation](docs/)
- Review the [FAQ](docs/FAQ.md)

## 🔄 Roadmap

- [ ] Mobile application (React Native/Flutter)
- [ ] Calendar integration
- [ ] Advanced spam filtering
- [ ] Email templates
- [ ] Plugins/Extensions system
- [ ] Multi-account support