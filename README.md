# TaskFlow — Collaborative Project Management Platform

A full-stack web application for managing projects, assigning tasks, and tracking team workflows through role-based access control

---
## 📌 Overview

- TaskFlow is a collaborative project management platform that enables teams to manage projects, assign tasks, track progress, and enforce role-based access control through a modern full-stack architecture.
- Integrated with GitHub-based CI/CD deployment workflows using Vercel and Railway.

---

## 🚀 Live Demo

- **Frontend:** https://task-manager-ashy-delta.vercel.app
- **Backend API:** https://task-manager-production-020e.up.railway.app
- - **GitHub Repository:** https://github.com/pathan-sahil07/task-manager

## 📸 Screenshots

### Login Page
![Login](screenshots/login.png)

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Projects
![Projects](screenshots/projects.png)

### Kanban Board
![Kanban](screenshots/kanban.png)

## 🛠 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 14 (App Router), Tailwind CSS |
| Backend    | Node.js, Express.js               |
| Database   | PostgreSQL (via Prisma ORM)       |
| Auth       | JWT (Bearer token)                |
| Deployment | Vercel (Frontend), Railway (Backend & PostgreSQL) |

---

## ✨ Features

### Authentication
- Signup / Login with email & password
- JWT-based session management
- Protected routes (client & server)

### Projects
- Create, view, update, delete projects
- Add/remove team members with roles (Admin/Member)
- Project overview with task counts

### Tasks
- Create tasks with title, description, priority, due date, assignee
- Kanban board view (To Do / In Progress / In Review / Done)
- Status updates by any assigned member
- Full CRUD for project admins
- Overdue task highlighting

### Dashboard
- Total / In Progress / Done / Overdue task counts
- Visual progress bars per status
- Recent tasks quick view

### Role-Based Access Control (RBAC)

| Action                  | Global Admin | Project Admin | Project Member |
|-------------------------|:---:|:---:|:---:|
| View projects            | ✅  | ✅  | ✅  |
| Create projects          | ✅  | ✅  | ✅  |
| Edit/delete project      | ✅  | ✅  | ❌  |
| Add/remove members       | ✅  | ✅  | ❌  |
| Create tasks             | ✅  | ✅  | ❌  |
| Edit/delete tasks        | ✅  | ✅  | ❌  |
| Update task status       | ✅  | ✅  | ✅ (own tasks) |
| View all tasks           | ✅  | ✅  | ✅  |

---

## 📁 Project Structure

```
task-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # DB schema (User, Project, Task, etc.)
│   │   └── seed.js              # Demo data seed
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT + RBAC middleware
│   │   ├── routes/
│   │   │   ├── auth.js          # POST /api/auth/signup|login, GET /me
│   │   │   ├── projects.js      # Full project CRUD + member management
│   │   │   ├── tasks.js         # Full task CRUD + dashboard stats
│   │   │   └── users.js         # User listing
│   │   └── index.js             # Express app entry point
│   ├── .env.example
│   └── railway.toml
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/login/    # Login page
    │   │   ├── (auth)/signup/   # Signup page
    │   │   ├── dashboard/       # Stats dashboard
    │   │   ├── projects/        # Project list + detail (kanban board)
    │   │   └── layout.jsx       # Root layout
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── Badges.jsx       # Status/Priority badges
    │   ├── context/
    │   │   └── AuthContext.jsx  # Global auth state
    │   └── lib/
    │       └── api.js           # Axios API client
    ├── .env.example
    └── railway.toml
```

---

## ⚙️ Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env — set your DATABASE_URL and JWT_SECRET

# Run DB migrations and generate Prisma client
npm run db:push
npm run db:generate

# Seed demo data (optional)
npm run db:seed

# Start development server
npm run dev
# Runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000

# Start development server
npm run dev
# Runs on http://localhost:3000
```

---

## 🌐 Deployment Architecture

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/your-username/task-manager.git
git push -u origin main
```

### Step 2: Deploy Database
1. Create a new Railway project at https://railway.app
2. Add a **PostgreSQL** plugin → copy the `DATABASE_URL`

### Step 3: Deploy Backend
1. Add a new service → connect your GitHub repo → select `backend/` folder
2. Set environment variables:
   ```
   DATABASE_URL=<from PostgreSQL plugin>
   JWT_SECRET=<random 64-char string>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.railway.app
   ```
3. Railway auto-runs: `npx prisma generate && npx prisma db push && node src/index.js`

### Step 4: Deploy Frontend
1. Add another service → connect GitHub repo → select `frontend/` folder
2. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```

### Step 5: Seed Demo Data
In Railway backend service terminal:
```bash
npm run db:seed
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint         | Auth | Description  |
|--------|-----------------|------|--------------|
| POST   | /api/auth/signup | ❌  | Register      |
| POST   | /api/auth/login  | ❌  | Login         |
| GET    | /api/auth/me     | ✅  | Current user  |

### Projects
| Method | Endpoint                        | Auth | Admin |
|--------|--------------------------------|------|-------|
| GET    | /api/projects                   | ✅  | ❌    |
| POST   | /api/projects                   | ✅  | ❌    |
| GET    | /api/projects/:id               | ✅  | ❌    |
| PUT    | /api/projects/:id               | ✅  | ✅    |
| DELETE | /api/projects/:id               | ✅  | ✅    |
| POST   | /api/projects/:id/members       | ✅  | ✅    |
| DELETE | /api/projects/:id/members/:uid  | ✅  | ✅    |

### Tasks
| Method | Endpoint                        | Auth | Description            |
|--------|--------------------------------|------|------------------------|
| GET    | /api/tasks/dashboard            | ✅  | Stats summary          |
| GET    | /api/tasks/my                   | ✅  | My assigned tasks      |
| GET    | /api/tasks/project/:projectId   | ✅  | Tasks in project       |
| POST   | /api/tasks                      | ✅  | Create task (admin)    |
| GET    | /api/tasks/:id                  | ✅  | Get task               |
| PUT    | /api/tasks/:id                  | ✅  | Update task            |
| DELETE | /api/tasks/:id                  | ✅  | Delete task (admin)    |

---

## 🏗 Architecture

```text
Client (Next.js Frontend)
          ↓
REST API (Express.js Backend)
          ↓
Prisma ORM
          ↓
PostgreSQL Database
```

## Engineering Challenges Solved

- Fixed production CORS issues between Vercel and Railway
- Configured environment variables across cloud platforms
- Connected Prisma ORM with Railway PostgreSQL
- Resolved internal vs public database networking issues
- Implemented JWT authentication and RBAC authorization
- Deployed full-stack app with GitHub CI/CD integration
 --- 

## 📝 Database Schema

```
User          ── owns ──> Project
User          ── member of ──> ProjectMember <── Project
User          ── assigned to ──> Task
User          ── created ──> Task
Project       ── has ──> Task
```

Models: `User`, `Project`, `ProjectMember`, `Task`

Enums: `GlobalRole` (ADMIN/MEMBER), `ProjectRole` (ADMIN/MEMBER),
       `TaskStatus` (TODO/IN_PROGRESS/IN_REVIEW/DONE),
       `TaskPriority` (LOW/MEDIUM/HIGH/URGENT)

---
## 🚀 Future Improvements

- Real-time collaboration using WebSockets
- Email notifications
- File attachments
- Activity timelines
- Dockerized deployment
- Unit and integration testing
---  
## 🧪 Demo Credentials

| Role   | Email | Password |
|--------|-------|----------|
| Admin | admin@taskmanager.com | Admin@123 |
| Member | bob@taskmanager.com | Member@123 |



---
## 👤 Author

PATHAN SAHIL - sahil515591@gmail.com
