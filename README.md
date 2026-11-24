# TaskFlow — Task and Productivity Planner

A full-stack B.Tech CSE project built with **React**, **Tailwind CSS**, **Chart.js**, **Node.js**, **Express.js**, and **MongoDB Atlas (Mongoose)**.

## Implemented Features

- **Full CRUD Task Management**: Create, view, update, and delete student tasks stored persistently in MongoDB.
- **Dynamic Productivity Dashboard**: Real-time summary cards (Total, Pending & Active, Completed, Overdue, Today's Tasks) and **Chart.js** charts (Completion Status doughnut, Priority Breakdown bar chart, 7-Day Deadline Load) computed directly from MongoDB data.
- **Search, Filter & Sort**: Search by title/description/category/tag; filter by status, priority, category, tag, or due date; sort by deadline, priority, or progress.
- **Deadline Alerts & Reminders**: Automatic overdue detection, due-today focus view, 48-hour approaching deadline warnings, and opt-in browser notifications while the tab is open.
- **Progress Tracking**: Interactive progress slider (`0–100%`) synced with task statuses (`Pending`, `In Progress`, `Completed`).
- **Responsive Design & Theme**: Works across desktop, tablet, and mobile viewports with a clean Light/Dark theme toggle.

## Project Structure

```text
.
├── backend/
│   ├── config/
│   │   └── db.ts                # Mongoose MongoDB Atlas connection manager
│   ├── controllers/
│   │   └── taskController.ts    # CRUD handlers & MongoDB dashboard aggregation
│   ├── middleware/
│   │   ├── errorHandler.ts      # Centralized Express error handling
│   │   ├── requireDB.ts         # Ensures MongoDB connection before DB operations
│   │   └── validateTask.ts      # Request sanitization & input validation
│   ├── models/
│   │   └── Task.ts              # Mongoose Task schema with timestamps
│   ├── routes/
│   │   └── taskRoutes.ts        # REST API router (/api/tasks)
│   ├── utils/
│   │   └── deadline.ts          # Overdue, due-today, and 48h alert logic
│   └── seed.ts                  # Optional CLI seed script (npm run seed)
├── src/
│   ├── components/              # Modular React UI & Chart.js components
│   ├── lib/                     # Fetch API client & client deadline helpers
│   ├── types/                   # TypeScript interfaces
│   ├── App.tsx                  # Main application layout & state
│   ├── index.css                # Tailwind CSS v4 styles
│   └── main.tsx                 # React entry point
├── server.ts                    # Express server + Vite dev / dist static serving
├── .env.example                 # Environment variable template
├── index.html                   # HTML entry point & Google Fonts
└── package.json                 # Dependencies & scripts
```

## MongoDB Atlas Setup Instructions

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create or sign in to your account.
2. Create a new project and click **Build a Database** &rarr; choose **M0 Sandbox (Free)**.
3. Under **Database Access**, add a new database user (e.g., `taskflow_user`) with a strong password and **Read and write to any database** permissions.
4. Under **Network Access**, click **Add IP Address** and add your current IP (or `0.0.0.0/0` for demo/cloud access).
5. Return to **Database**, click **Connect** &rarr; **Drivers**, and copy your Node.js connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskplanner?retryWrites=true&w=majority
   ```
6. Copy `.env.example` to `.env` and set `MONGODB_URI` to your connection string.

## Installation & Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env and paste your MONGODB_URI

# 3. (Optional) Seed sample student tasks into MongoDB
npm run seed

# 4. Run full-stack app in development (Express API + React Vite frontend)
npm run dev

# 5. Production build & run
npm run build
npm start
```

## API Endpoints

- `GET /api/health` — Check server & MongoDB connection health
- `GET /api/tasks` — List/filter/sort tasks from MongoDB
- `GET /api/tasks/stats` — Get real-time dashboard statistics & chart data
- `GET /api/tasks/:id` — Retrieve a single task by ID
- `POST /api/tasks` — Create a new task
- `PUT /api/tasks/:id` — Update a task
- `PATCH /api/tasks/:id` — Partially update task fields (e.g., progress/status)
- `DELETE /api/tasks/:id` — Delete a task
