# Brandie Backend Engineer Assignment – Social Media Backend

## Introduction

This project is a small-scale social media backend API built for the Brandie Backend Engineer assignment. It demonstrates core social networking functionality:

- User registration and authentication
- User following/unfollowing and social graph management
- Retrieving follower/following lists
- Creating posts with text and media
- Personalized user feed and post retrieval

The goal is to provide a **clean, well-structured implementation** using Node.js 18+, TypeScript, and either PostgreSQL or Neo4j. Authentication uses JWT, and the backend is Dockerized for easy setup and deployment.

- **Live API Base URL:** `<Deployment URL placeholder>`
- **Postman Collection:** `<Postman link placeholder>`
- **GitHub Repository:** `<Repo link placeholder>`

---

## Features

- **Follow/Unfollow Users:**

  - Users can follow or unfollow others. Follows are validated (no self-follow, no duplicates) and follower/following counts update accordingly.
  - Relationship changes are reflected in the social graph.

- **Followers & Following Lists:**

  - Retrieve followers or following for any user. Supports pagination or filtering for large lists.

- **Create Posts (Text & Media):**

  - Authenticated users can post text and optionally attach media (as URL or path). Each post has an author and timestamp.

- **User Timeline (Feed):**

  - Authenticated users get a feed of recent posts from people they follow, sorted by recency.

- **User’s Posts:**

  - Retrieve all posts made by a specific user for profile/timeline views.

All features prioritize correctness, efficient database lookups, and proper validation.

---

## Tech Stack

- **Language & Runtime:** Node.js 18+ with TypeScript
- **Framework:** Express.js for RESTful API (assignment allows GraphQL, but this implementation uses REST)
- **Database:** PostgreSQL 15 _or_ Neo4j 4.x (choose via env)

  - PostgreSQL: Relational tables for Users, Posts, Follows (join table with foreign keys)
  - Neo4j: User and Post nodes, FOLLOWS and POSTED relationships

- **ORM/Driver:**

  - Postgres: Knex, TypeORM, Prisma, or native pg
  - Neo4j: Official Neo4j JavaScript driver

- **Authentication:** JSON Web Tokens (JWT)
- **Other Libraries:** bcrypt (password hashing), dotenv (env vars), Joi/Celebrate (validation, optional), cors (CORS), Jest/Supertest (testing)
- **Dev Tools:** Nodemon, ts-node-dev, Docker/Docker Compose, Postman

---

## Architecture and Data Model

### Data Model

- **User:**

  - Unique ID/username, name, email (unique), hashed password
  - Table in Postgres, node with properties in Neo4j

- **Post:**

  - ID, text, optional media URL/path, timestamp, author reference
  - Posts table in Postgres, Post node in Neo4j

- **Follow Relationship:**

  - Postgres: Join table (`Follows`) with (follower_id, followee_id) as composite key
  - Neo4j: Directed FOLLOWS relationship between User nodes

Indexes ensure efficient lookups. Design enables fast queries for followers, following, user posts, and feed.

### Project Structure

```
src/
├── models/         # DB schema definitions and models
├── controllers/    # Route handlers/business logic
├── routes/         # Express route definitions
├── services/       # Reusable services/helpers
├── middleware/     # JWT auth, validation
├── utils/          # Utility functions (error formatting, pagination)
└── index.ts        # Server entry point
```

**Layered structure for clear separation of concerns:**

- **Routes:** Define endpoints and HTTP methods
- **Controllers:** Handle requests, interact with models/services, build responses
- **Models:** DB queries and ORM logic
- **Middleware:** Cross-cutting concerns like authentication and validation
- **Services/Utils:** Shared business logic

Extensible for future features (comments, likes, etc).

---

## Design Decisions & Trade-offs

- **API Style:**

  - Chose RESTful API (Express.js) for simplicity and clarity. (GraphQL would be valid and reduce round-trips, but REST is easier for demonstration.)

- **Database:**

  - Chose PostgreSQL for reliability and ease of setup; Neo4j supported via abstraction.
  - Join tables and indexes enable efficient follow/post/feed lookups in SQL; Neo4j allows natural graph traversal.

- **Authentication:**

  - JWT for stateless, scalable authentication. Tokens are signed with a strong secret and have expiration.
  - All protected routes require `Authorization: Bearer <token>`

- **User Registration:**

  - Included registration and login endpoints (even if not required) for easier testing.
  - Passwords hashed with bcrypt, never stored as plain text.

- **Media Handling:**

  - Posts accept media as URL or file path (no binary upload for assignment scope). In a real app, file uploads would be integrated (e.g. S3).

- **Feed Generation:**

  - Assembles feed on-the-fly by joining posts from followed users. No caching or fan-out implemented (can be added for scale).

- **Validation & Error Handling:**

  - Manual checks and meaningful error messages; could use Joi for full schema validation. All DB ops wrapped in try/catch.

- **Security:**

  - SQL queries parameterized or ORM used to prevent injection.
  - JWT secret set via env; never hardcoded.
  - CORS configured for dev and prod.

- **Assumptions:**

  - No privacy settings (all users/posts public).
  - No delete user/post feature.
  - Minimal model—no comments, likes, or cascading deletes.

---

## Authentication

- **Register:** `POST /auth/register` with username, email, password. Password is hashed and stored; returns JWT on success.
- **Login:** `POST /auth/login` with email/password. Returns JWT on success.
- **JWT:** Signed with `JWT_SECRET` env var. All protected endpoints require header: `Authorization: Bearer <token>`

**Protected endpoints:**

- POST /users/{id}/follow
- DELETE /users/{id}/follow
- POST /posts
- GET /feed

---

## Setup Instructions (Local Development)

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL 15 or Neo4j 4.x (can run in Docker)
- Docker (optional but recommended)

### Steps

1. **Clone the repo:**

   ```sh
   git clone <repository-url.git>
   cd <repository-folder>
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Configure environment:**

   - Copy `.env.example` to `.env` and set values:

     ```
     PORT=3000
     JWT_SECRET=your_secret
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=brandie_db
     DB_USER=postgres
     DB_PASSWORD=postgres
     NODE_ENV=development
     ```

   - Or set Neo4j env vars if using graph DB.

4. **Database setup:**

   - **Postgres:** Create DB schema and run migrations (if any)
   - **Neo4j:** Ensure unique constraints on username/email

5. **Start server:**

   - Dev (hot reload):

     ```sh
     npm run dev
     ```

   - Prod:

     ```sh
     npm run build
     npm start
     ```

---

## Docker Setup

### Using Docker Compose (Recommended)

1. Ensure Docker is running.
2. In project root, run:

   ```sh
   docker-compose up --build
   ```

3. API available at `http://localhost:3000` by default.
4. To stop:

   ```sh
   docker-compose down
   ```

### Using Docker Manually (CLI)

1. Build app image:

   ```sh
   docker build -t brandie-backend:latest .
   ```

2. Run Postgres DB:

   ```sh
   docker run -d --name brandie-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=brandie_db -p 5432:5432 postgres:15
   ```

3. Run app container:

   ```sh
   docker run -d --name brandie-app -p 3000:3000 --env-file .env --link brandie-postgres brandie-backend:latest
   ```

**Notes:**

- Use Docker volumes for persistent DB data.
- Update DB host in `.env` if using Docker networking (not `localhost`).
- For Neo4j, use similar steps with `neo4j` Docker image and set `NEO4J_AUTH` env.

---

## API Overview

### Authentication & User Management

| Endpoint              | Description                                   | Auth |
| --------------------- | --------------------------------------------- | ---- |
| POST `/auth/register` | Register new user (username, email, password) | No   |
| POST `/auth/login`    | Login (email, password)                       | No   |

### Social Graph

| Endpoint                    | Description             | Auth |
| --------------------------- | ----------------------- | ---- |
| POST `/users/{id}/follow`   | Follow a user           | Yes  |
| DELETE `/users/{id}/follow` | Unfollow a user         | Yes  |
| GET `/users/{id}/followers` | List user's followers   | No   |
| GET `/users/{id}/following` | List who a user follows | No   |

### Posts and Feeds

| Endpoint                | Description                               | Auth |
| ----------------------- | ----------------------------------------- | ---- |
| POST `/posts`           | Create a new post (text/media)            | Yes  |
| GET `/users/{id}/posts` | List posts by user                        | No   |
| GET `/feed`             | Personalized feed (followed users’ posts) | Yes  |

**General behaviors:**

- 201 Created for successful POSTs; 400/401/404 for errors.
- All timestamps in ISO 8601 UTC.
- Follows REST conventions for status codes and JSON structure.

---

## Test Cases

1. **User Registration & Login:**

   - Register a user → 201 Created, JWT returned
   - Login with correct credentials → 200 OK, JWT returned
   - Login with wrong credentials → 401 Unauthorized

2. **Follow/Unfollow:**

   - Auth user A follows B → 200 OK; B in A's following, A in B's followers
   - A unfollows B → 200 OK; relationship removed
   - Attempt self-follow or duplicate follow → 400 Bad Request

3. **Followers/Following Lists:**

   - Lists reflect follow relationships; empty lists return 200 with \[]

4. **Create Post:**

   - Authenticated user creates post → 201 Created, post retrievable
   - Unauthenticated user → 401 Unauthorized
   - Empty text or invalid data → 400 Bad Request

5. **User's Posts/Feed:**

   - GET /users/{id}/posts → returns all user posts sorted by createdAt
   - GET /feed → posts from followed users only
   - After unfollow, unfollowed user's posts disappear from feed

6. **Unauthorized/Invalid Requests:**

   - Protected endpoints without valid JWT → 401
   - Follow non-existent user → 404 Not Found
   - Register with invalid email/password → 400

7. **Data Consistency:**

   - Relationships and post counts match across endpoints

**Tip:** Use Postman collection for testing each scenario interactively.

---

## Deployment Instructions

1. **Provision production database** (managed Postgres/Neo4j or Docker container)
2. **Set environment variables** for DB, JWT secret, port, etc. (do not use default or insecure values in prod)
3. **Build Docker image:**

   ```sh
   docker build -t brandie-backend:prod .
   ```

4. **Deploy Docker image** to cloud platform (Heroku, AWS ECS, Render, DigitalOcean, etc.)
5. **Configure domain/HTTPS** as needed (platforms like Heroku/Render provide HTTPS by default)
6. **Test live API** with Postman/curl; ensure all endpoints function

**Scaling:**

- Stateless JWT authentication allows horizontal scaling (multiple containers/instances)
- Monitor logs and DB performance in production

**CI/CD (Optional):**

- Use GitHub Actions or similar for automated build/deploy pipeline

---

## Documentation

Comprehensive project documentation is available in the [`docs/`](./docs/) folder:

- **[📋 Project Progress](./docs/PROJECT_PROGRESS.md)** - Development status and completed phases
- **[🏗️ Folder Structure](./docs/FOLDER_STRUCTURE.md)** - Code organization and architecture
- **[✅ Setup Complete](./docs/SETUP_COMPLETE.md)** - Database and environment setup guide
- **[📚 Docs Organization Summary](./docs/DOCS_ORGANIZATION_SUMMARY.md)** - Documentation structure guide

For a complete documentation index, see [`docs/README.md`](./docs/README.md).

---

## Contact & Support

For issues, raise a GitHub issue or reach out to the project maintainer. See comments in code for additional technical details and implementation notes.

Happy testing and coding!
