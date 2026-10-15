# 📚 Library Management API

> A NestJS and Neo4j REST API for library management, graph-based recommendations, reservations, borrowing workflows, analytics, and role-based access control.

[![NestJS](https://img.shields.io/badge/NestJS-Backend-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Neo4j](https://img.shields.io/badge/Neo4j-Graph%20Database-008CC1?style=flat-square&logo=neo4j&logoColor=white)](https://neo4j.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://swagger.io/)

## Overview

This project implements a library management backend around a graph data model rather than a traditional relational schema.

It covers authentication, users, books, copies, borrowing, reservations, scoring, analytics, and recommendation logic. Neo4j is used to model and traverse relationships between users, books, genres, reviews, reservations, and borrowing activity.

## Features

- JWT authentication and role-based access control
- Book catalog and copy management
- Borrowing and returns
- Reservation queues and calendar availability
- User score and privilege tiers
- Analytics for trends, demand, and user behavior
- Graph-based recommendation engine
- Swagger API documentation
- Dockerized Neo4j and API deployment

## Architecture

```text
                         ┌────────────────────┐
                         │       REST API      │
                         │      NestJS         │
                         └─────────┬──────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             ▼                     ▼                     ▼
       ┌───────────┐        ┌─────────────┐       ┌────────────┐
       │   Auth    │        │  Business   │       │ Analytics  │
       │ JWT / RBAC│        │   Modules   │       │ & Scoring  │
       └───────────┘        └──────┬──────┘       └─────┬──────┘
                                   │                    │
                                   └────────┬───────────┘
                                            ▼
                                     ┌─────────────┐
                                     │   Neo4j     │
                                     │ Graph Data  │
                                     └─────────────┘
```

## Domain Modules

```text
src/
├── auth/          # Authentication & authorization
├── users/         # Profiles and user management
├── books/         # Books and catalog
├── borrowing/     # Borrow / return workflows
├── reservation/   # Reservations and queues
├── analytics/     # System and user analytics
├── score/         # User scoring and privileges
└── neo4j/         # Graph database integration
```

## Graph Model

The domain is represented through relationships that are useful for graph traversal:

```text
(User)-[:BORROWED]->(Borrow)-[:OF_COPY]->(BookCopy)
(User)-[:RESERVED]->(Reservation)-[:OF_BOOK]->(Book)
(Book)-[:HAS_COPY]->(BookCopy)
(Book)-[:BELONGS_TO]->(Genre)
(User)-[:REVIEWED]->(Review)-[:ON]->(Book)
(User)-[:HAS_SCORE_EVENT]->(ScoreEvent)
```

This model makes relationship-heavy features such as recommendations, user behavior analysis, and related-book discovery natural to implement with Neo4j.

## API Surface

### Authentication
- `POST /api/auth/sign-up`
- `POST /api/auth/sign-in`
- `POST /api/auth/refresh`

### Books
- `GET /api/books/search`
- `GET /api/books/:id`
- `POST /api/books`
- `PATCH /api/books/:id`

### Borrowing
- `POST /api/borrowing`
- `POST /api/borrowing/:id/return`
- `GET /api/borrowing`
- `GET /api/borrowing/overdue`

### Reservations
- `POST /api/reservations`
- `GET /api/reservations`
- `DELETE /api/reservations/:id`
- `GET /api/reservations/book/:bookId/queue`

### Analytics
- `GET /api/analytics/user/me`
- `GET /api/analytics/trending-books`
- `GET /api/analytics/demand-vs-supply`
- `GET /api/analytics/genre-distribution`

## User Score System

User activity affects a score that determines borrowing privileges.

| Tier | Score | Concurrent borrows | Loan duration |
|---|---:|---:|---:|
| Bronze | 0–99 | 3 | 21 days |
| Silver | 100–149 | 5 | 30 days |
| Gold | 150–299 | 8 | 45 days |
| Diamond | 300+ | 10 | 60 days |

Examples of score events include on-time returns, late returns, reservation cancellations, genre diversity, and regular activity.

## Technology Stack

| Technology | Responsibility |
|---|---|
| NestJS | REST API and application architecture |
| TypeScript | Application language |
| Neo4j | Graph persistence and traversal |
| JWT | Authentication |
| RBAC | Authorization |
| Swagger / OpenAPI | API documentation |
| Docker Compose | Local deployment |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker and Docker Compose

### Install

```bash
npm install
cp .env.example .env
```

Configure the Neo4j and JWT values in `.env`.

### Start Neo4j

```bash
docker compose up -d neo4j
```

### Run the API

```bash
npm run start:dev
```

Swagger documentation is available at:

```text
http://localhost:3000/docs
```

### Build / production

```bash
npm run build
npm start
```

## Development

```bash
npm run start:dev
npm run lint
npm run format
npm run build
```

## Testing the API

Example authentication request:

```bash
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

Protected endpoints use a bearer token:

```bash
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Status

A backend engineering project focused on REST API design, authorization, graph data modeling, relationship-heavy business logic, analytics, and recommendation workflows.
