# SkillSwap Campus

A full-stack skill-sharing platform for college students: create a profile, list skills you can
teach and skills you want to learn, get AI-ranked matches, send swap requests, chat, schedule
sessions, leave reviews, and earn credits for completed swaps.

- **Backend:** Node.js + Express + SQLite (via `better-sqlite3`), JWT auth
- **Frontend:** React (Vite) + Tailwind CSS
- **Database:** SQLite — a single file, zero configuration, perfect for running locally

```
skillswap-campus/
├── backend/     Express API + SQLite database
└── frontend/    React + Vite + Tailwind UI
```

## 1. Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer (includes npm)
- VS Code (or any editor/terminal)

No external database server is required — SQLite stores everything in a local file at
`backend/data/skillswap.sqlite`, created automatically the first time the server runs.

## 2. Backend setup

Open a terminal in the `backend/` folder:

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set a real secret for `JWT_SECRET` (any long random string works, e.g. generate
one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

Seed the database with a master skill list and a few demo accounts (recommended for first run):

```bash
npm run seed
```

This prints demo login credentials, including:

```
admin@skillswap.edu / Admin123!   (admin dashboard access)
alice@campus.edu    / Password123!
ben@campus.edu      / Password123!
carla@campus.edu    / Password123!
```

Start the API server:

```bash
npm run dev      # auto-restarts on changes (nodemon)
# or
npm start        # plain node
```

The API runs at **http://localhost:5000**. Visit `http://localhost:5000/api/health` to confirm
it's up.

## 3. Frontend setup

Open a **second** terminal in the `frontend/` folder:

```bash
cd frontend
npm install
npm run dev
```

The app runs at **http://localhost:5173**. Vite is configured to proxy any request to `/api` to
the backend at `http://localhost:5000`, so no extra configuration is needed — just make sure the
backend is running first.

Log in with one of the seeded accounts above, or register a brand new account.

## 4. Using the app

- **Profile** — add skills you can teach (with a level) and skills you want to learn.
- **Discover** — the "For you" tab uses the built-in match-scoring engine to rank other students
  by mutual skill fit; "Browse all" lets you search everyone by name, bio, or skill.
- **Swaps** — send a swap request from a match card, then accept/decline, cancel, schedule
  sessions, and mark a swap "completed" (this pays out credits to both students).
- **Chat** — once a swap is accepted, a conversation thread opens automatically.
- **Reviews** — after a swap is marked completed, both students can leave a star rating + comment.
- **Credits** — every completed swap earns both participants credits, visible in the navbar and on
  the dashboard.
- **Admin** — log in as `admin@skillswap.edu` to see platform stats, ban/unban users, and manage
  user-submitted reports.

## 5. Building for production

Frontend:

```bash
cd frontend
npm run build      # outputs static files to frontend/dist
npm run preview    # optional: preview the production build locally
```

Serve `frontend/dist` with any static host (Netlify, Vercel, nginx, etc.), and deploy the
`backend/` folder to any Node host. Update `CLIENT_URL` in the backend's `.env` to your deployed
frontend origin (for CORS), and update the frontend's API base URL / proxy target to your deployed
backend origin.

## 6. Project structure reference

```
backend/
  src/
    db/
      schema.sql        Table definitions
      init.js            Opens the SQLite file and applies the schema on boot
      seed.js            Demo data — run with `npm run seed`
    middleware/
      auth.js            JWT verification + admin guard
      errorHandler.js    Validation + async error handling
    routes/
      auth.routes.js         Register / login / me
      users.routes.js        Profile + skills CRUD
      skills.routes.js       Master skill list / search
      discover.routes.js     Browse + AI recommendations
      swaps.routes.js        Swap request lifecycle
      sessions.routes.js     Scheduling learning sessions
      messages.routes.js     Chat within a swap
      reviews.routes.js      Ratings & reviews
      credits.routes.js      Credit balance & history
      notifications.routes.js
      reports.routes.js      Users filing reports
      admin.routes.js        Admin-only stats/users/reports
    utils/
      matching.js        The recommendation-scoring algorithm
      notify.js          Notification helper
    server.js            Express app entry point

frontend/
  src/
    api/client.js            Axios instance with auth header + 401 handling
    context/AuthContext.jsx  Login/register/logout/current-user state
    components/              Navbar, ProtectedRoute, SkillPill, StarRating, PageLoader
    pages/                   Landing, Login, Register, Dashboard, Profile, Discover,
                              Swaps, SwapDetail, Chat, Admin, NotFound
    App.jsx                  Route definitions
    main.jsx                 App bootstrap
```

## 7. Notes on the "AI" matching feature

The recommendation engine (`backend/src/utils/matching.js`) is a transparent, rule-based scoring
system rather than a black-box ML model — this keeps the project runnable offline with zero API
keys, while still giving each match a clear, explainable score:

- **+3** for each skill the candidate can teach that you want to learn
- **+2** for each skill you can teach that the candidate wants to learn (reciprocity bonus)
- **+1** for each shared "want to learn" interest (common ground)

Candidates are ranked by total score, and the UI shows *why* each match scored well.
