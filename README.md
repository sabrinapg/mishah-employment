# Mishah Employment Agency — Website + Backend

A full-stack site for Mishah Employment Agency (Brunei): a public marketing site,
a job board, employer/job-seeker accounts, and an admin dashboard — backed by a
small REST API.

## Structure

```
/                       Static frontend (open index.html in a browser, or serve with any static host)
  index.html            Home
  about.html            About
  services.html         Services
  jobs.html             Public job board (browse + apply)
  contact.html          General enquiry form
  login.html / register.html
  dashboard-employer.html   Post jobs, manage listings, review applicants
  dashboard-seeker.html     Track your applications
  dashboard-admin.html      Agency-wide view: accounts, jobs, enquiries
  style.css, script.js, auth-client.js
  assets/logo_tight.png

/backend                Node.js + Express REST API
  src/server.js          Entry point
  src/db.js              Data storage (JSON file via lowdb — no database server needed)
  src/auth.js             JWT auth middleware
  src/routes/             auth, jobs, applications, admin, contact endpoints
  data/db.json            Where all data lives (users, jobs, applications, leads)
```

## Running it locally

**Backend:**
```
cd backend
cp .env.example .env      # then edit JWT_SECRET to a long random string
npm install
npm start                 # runs on http://localhost:4000
```

On first run it seeds one admin account:
`admin@mishahemployment.bn` / `ChangeMe123!` — **log in and note this down; there's
no "forgot password" flow yet, so don't lose access to this account.**

**Frontend:**
Just open `index.html` in a browser, or serve the folder with any static server, e.g.:
```
python3 -m http.server 8080
```
The frontend talks to the backend at `http://localhost:4000/api` by default.

## How the data is stored

There's no external database — `backend/data/db.json` is a single JSON file that
holds everything (accounts, job listings, applications, contact-form leads).
This is intentionally simple and file-based so you don't need to set up or pay
for a database to get started. It's fine for a small agency's traffic; if this
grows a lot, swapping in a real database later means only changing `src/db.js`
— none of the routes need to change.

## Before this goes live

- **Change `JWT_SECRET`** in `.env` to a long random string (not the placeholder).
- **Change the seeded admin password** immediately after first login.
- **Update `API_BASE`** in `auth-client.js` (or set `window.MISHAH_API_BASE`
  before it loads) to point at your deployed backend URL instead of `localhost:4000`.
- **Back up `backend/data/db.json` regularly** — it's the only copy of your data.
- Replace the placeholder phone number, email, and office address across the
  site (footer, contact page) with real details.

## Deploying

The frontend is static — any static host works (Netlify, Vercel, Cloudflare
Pages, GitHub Pages, or a VPS with nginx).

The backend needs a place that keeps a Node process running (not a purely
static host), for example Render, Railway, Fly.io, or a small VPS. Set
`JWT_SECRET` and `PORT` as environment variables there, and make sure the
`data/` folder is on persistent storage so `db.json` survives restarts and
deploys — on some platforms (e.g. Render's free tier) the filesystem resets
on redeploy, so check that before relying on it long-term; if it doesn't
persist, that's the point to swap in a real hosted database.
