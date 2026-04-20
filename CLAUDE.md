# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack personal finance management app (Vietnamese language UI). Backend: Node.js + Express 5 + PostgreSQL. Frontend: React 19 + React Router 7.

## Commands

### Backend (`/backend`)
```bash
npm run dev    # Development with auto-reload (node --watch), port 5000
npm start      # Production server
```

### Frontend (`/frontend`)
```bash
npm start      # Dev server, port 3000
npm test       # Jest in interactive watch mode
npm run build  # Production build
```

### Running a single test (frontend)
```bash
# From /frontend directory
npm test -- --testPathPattern="App.test" --watchAll=false
```

## Architecture

### Backend structure
```
backend/src/
├── app.js              # Express entry point, CORS, route mounting
├── db/
│   ├── index.js        # PostgreSQL connection pool (pg)
│   └── schema.sql      # All table definitions
├── middleware/
│   └── auth.js         # JWT validation — attaches req.user.id
└── routes/
    ├── auth.js         # POST /api/auth/register, /api/auth/login
    ├── transactions.js # CRUD + filtering, pagination, CSV import
    ├── dashboard.js    # Summary stats, 6-month trends, category breakdown
    ├── misc.js         # Categories, budgets, notifications, predictions
    └── import.js       # Multer-based CSV upload
```

All DB queries use raw SQL via `pg`. Every query is scoped to `user_id` — never query without it.

### Frontend structure
```
frontend/src/
├── App.js              # Router + PrivateRoute/PublicRoute guards
├── context/
│   └── AuthContext.js  # Auth state; JWT + user stored in localStorage
├── services/
│   └── api.js          # Axios client; interceptor auto-attaches Bearer token
├── components/
│   └── Layout.js       # Sidebar navigation wrapper
└── pages/              # One file per route
```

### Auth flow
1. Login → JWT (7-day) + user object stored in `localStorage`
2. `AuthContext` exposes `user`, `login()`, `logout()`
3. Axios interceptor in `api.js` reads token from localStorage and sets `Authorization` header on every request
4. Backend `auth.js` middleware validates token and attaches `req.user` — protected routes all go through this middleware

### Environment setup
Copy `backend/.env.example` to `backend/.env` and fill in PostgreSQL credentials. The schema is in `backend/src/db/schema.sql` — run it against a PostgreSQL 14+ database to initialize tables.
