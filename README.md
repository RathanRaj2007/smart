# Smart Interview

An AI-powered Adaptive Interview platform with Knowledge Base integration.

## Prerequisites
- Node.js (v18 or higher)
- Docker Desktop (for running PostgreSQL with pgvector and Redis)

## 1. Environment Setup

Create a `.env` file in the root directory and ensure it contains the following configuration:

```env
DATABASE_URL="postgresql://admin:adminpassword@localhost:5433/smartinterview"
REDIS_URL="redis://localhost:6380"
SESSION_SECRET="your-32-character-secret-goes-here-make-it-secure"
GEMINI_API_KEY="your-gemini-api-key"
GROQ_API_KEY="your-groq-api-key"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="adminpassword"
```

## 2. Start Services (Database & Redis)

Start the required PostgreSQL and Redis instances using Docker:
```bash
docker-compose up -d
```

## 3. Install Dependencies & Setup Database

Install the project dependencies and initialize the database schema:
```bash
npm install
npm run db:migrate
npm run db:seed
```

## 4. Run the Application

To start both the Next.js web application and the background worker concurrently, run:

```bash
npm run dev
```

*(This starts the Next.js server at http://localhost:3000 and the background task processor in the same terminal)*
