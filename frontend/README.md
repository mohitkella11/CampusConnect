# CampusConnect – Smart Campus Service & Issue Management Platform

CampusConnect is a full-stack web application designed to simplify campus maintenance and issue management. Students can report campus problems, track their status, and receive notifications. Staff can manage and resolve assigned issues, while administrators oversee campus operations.

## Features

### Student

- Register and log in securely
- Report campus issues with descriptions and images
- Track issue status and view issue history
- Receive notifications about issue updates
- Rate resolved issues

### Staff

- View and manage campus issues
- Update issue status
- Receive notifications
- Help resolve reported problems

### Admin

- View and manage reported issues
- Assign issues to staff
- Manage staff
- View analytics and ratings
- Receive notifications about new issues

## Technology Stack

| Layer          | Technologies                 |
| -------------- | ---------------------------- |
| Frontend       | React, Vite, JavaScript, CSS |
| Backend        | Java 17, Spring Boot         |
| Database       | MySQL                        |
| Build Tool     | Maven                        |
| Authentication | JWT                          |
| Image Storage  | Cloudinary                   |

## Project Structure

```text
CampusConnect/
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── mvnw
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Java 17
- Node.js and npm
- MySQL 8
- Maven (or use the included Maven wrapper)

### 1. Clone the repository

```bash
git clone https://github.com/mohitkella11/CampusConnect.git
cd CampusConnect
```

### 2. Configure the database

Create a MySQL database:

```sql
CREATE DATABASE campusconnect_db;
```

Configure your database connection, JWT secret, and Cloudinary credentials in the backend configuration using environment variables or your local configuration.

**Do not commit passwords, API keys, or other secrets.**

### 3. Run the backend

Open a terminal:

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

The backend runs at:

```text
http://localhost:8080
```

### 4. Run the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in your terminal, usually:

```text
http://localhost:5173
```

## Main Modules

- Authentication and role-based access
- Issue reporting and tracking
- Staff assignment and issue status updates
- Notifications and issue history
- Issue comments and ratings
- Admin analytics
- Image upload and storage

## Future Enhancements

- Email and push notifications
- Improved mobile responsiveness
- Advanced reporting and analytics
- Deployment for real campus use

## Author

**Mohit Kella**

GitHub: [mohitkella11](https://github.com/mohitkella11)

## License

This project is developed for educational and portfolio purposes.
