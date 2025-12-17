# Library Management System - NestJS REST API

A production-ready REST API for a Library Management System built with **NestJS**, **TypeScript**, and **Neo4j**.

## Features

- **JWT Authentication** with role-based access control
- **User Score & Priority System** for dynamic borrowing privileges
- **Book Borrowing & Reservations** with calendar-based availability
- **Real-time Analytics** for trending books and user behavior
- **Recommendations Engine** using graph traversal
- **Admin Dashboard** capabilities
- **Swagger Documentation** for all endpoints
- **Neo4j Graph Database** for complex relationship management

## Architecture

```
src/
├── auth/                 # Authentication & Authorization
├── users/                # User management & profiles
├── books/                # Book catalog management
├── borrowing/            # Borrow operations
├── reservation/          # Reservation calendar logic
├── analytics/            # User & system analytics
├── score/                # Score & privilege system
├── neo4j/                # Database service
└── main.ts               # Application entry
```

## Installation

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for Neo4j)
- npm or yarn

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Neo4j credentials

3. **Start Neo4j with Docker:**
   ```bash
   docker-compose up -d neo4j
   ```

4. **Run the application:**
   ```bash
   npm run start:dev
   ```

5. **Seed the database (optional):**
   ```bash
   npm run seed
   ```

## API Documentation

Once running, Swagger docs are available at: **http://localhost:3000/docs**

## Key Endpoints

### Authentication
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login
- `POST /api/auth/refresh` - Refresh token

### Books
- `GET /api/books/search` - Search books
- `GET /api/books/:id` - Get book details
- `POST /api/books` - Create book (admin)
- `PATCH /api/books/:id` - Update book (admin)

### Borrowing
- `POST /api/borrowing` - Borrow a book
- `POST /api/borrowing/:id/return` - Return book
- `GET /api/borrowing` - User's borrow history
- `GET /api/borrowing/overdue` - Overdue books

### Reservations
- `POST /api/reservations` - Create reservation
- `GET /api/reservations` - User's reservations
- `DELETE /api/reservations/:id` - Cancel reservation
- `GET /api/reservations/book/:bookId/queue` - Reservation queue

### Users
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update profile
- `GET /api/users/:id/analytics` - User analytics

### Analytics
- `GET /api/analytics/user/me` - Personal analytics
- `GET /api/analytics/trending-books` - Trending books
- `GET /api/analytics/demand-vs-supply` - Inventory analysis
- `GET /api/analytics/genre-distribution` - Genre statistics

## Score System

Users earn points for:
- **+10** - On-time book return
- **-25** - Late return (+ penalties for late days)
- **-5** - Reservation cancellation
- **+5** - Reading diverse genres
- **+3** - Regular activity

Score tiers unlock privileges:
- **BRONZE** (0-99): 3 concurrent borrows, 21 days
- **SILVER** (100-149): 5 concurrent borrows, 30 days
- **GOLD** (150-299): 8 concurrent borrows, 45 days
- **DIAMOND** (300+): 10 concurrent borrows, 60 days

## Database Schema

Core Neo4j nodes and relationships:
```
(User)-[:BORROWED]->(Borrow)-[:OF_COPY]->(BookCopy)
(User)-[:RESERVED]->(Reservation)-[:OF_BOOK]->(Book)
(Book)-[:HAS_COPY]->(BookCopy)
(Book)-[:BELONGS_TO]->(Genre)
(User)-[:REVIEWED]->(Review)-[:ON]->(Book)
(User)-[:HAS_SCORE_EVENT]->(ScoreEvent)
```

## Development

```bash
# Start development server with hot reload
npm run start:dev

# Run linting
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

### Docker Deployment

```bash
docker-compose up -d
```

This will:
- Start Neo4j database on port 7687
- Build and start the API on port 3000
- Create persistent volumes for data

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEO4J_URI` | Neo4j connection URL | `bolt://localhost:7687` |
| `NEO4J_USER` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | `password` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |

## Project Structure

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── decorators/
│   ├── guards/
│   ├── strategies/
│   └── dto/
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.controller.ts
│   └── dto/
├── books/
│   ├── books.module.ts
│   ├── books.service.ts
│   ├── books.controller.ts
│   └── dto/
├── borrowing/
│   ├── borrowing.module.ts
│   ├── borrowing.service.ts
│   ├── borrowing.controller.ts
│   └── dto/
├── reservation/
│   ├── reservation.module.ts
│   ├── reservation.service.ts
│   ├── reservation.controller.ts
│   └── dto/
├── analytics/
│   ├── analytics.module.ts
│   ├── analytics.service.ts
│   ├── analytics.controller.ts
│   └── dto/
├── score/
│   ├── score.module.ts
│   ├── score.service.ts
│   └── score.controller.ts
├── neo4j/
│   ├── neo4j.module.ts
│   ├── neo4j.service.ts
│   └── constants.ts
├── app.module.ts
└── main.ts
```

## Testing the API

### Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

### Sign In
```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Access Protected Endpoints
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## License

MIT
