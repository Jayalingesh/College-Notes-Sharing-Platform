# CampusNotes — College Notes Sharing Platform

A full-stack MERN-style app (MongoDB, Express, React, Node.js) where students can
upload, browse, search, download, like, bookmark, and comment on study notes.

```
college-notes-platform/
├── server/     Express + Mongoose API, JWT auth, file uploads (Multer)
└── client/     React (Vite) frontend
```

## Features

- **Auth**: register/login with JWT, bcrypt-hashed passwords, protected routes
- **Notes**: upload (PDF/DOC/DOCX/PPT/PPTX/images/TXT, 25MB max), browse with
  search (MongoDB text index), filter by branch/semester/subject, sort by
  newest/oldest/most downloaded
- **Engagement**: like/unlike, bookmark, threaded comments, download counter
- **Dashboard**: "My notes" view with per-note stats and delete
- **Profile**: edit name, college, branch, semester

## 1. Prerequisites

- Node.js 18+
- A running MongoDB instance (local `mongod`, or a free MongoDB Atlas cluster)

## 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
# edit .env: set MONGO_URI to your MongoDB connection string,
# and JWT_SECRET to any long random string
npm run dev
```

The API starts on `http://localhost:5000`. Health check: `GET /api/health`.

## 3. Frontend setup

In a second terminal:

```bash
cd client
npm install
npm run dev
```

The app starts on `http://localhost:5173` and proxies `/api` and `/uploads`
requests to the backend automatically (see `client/vite.config.js`).

## 4. Using the app

1. Open `http://localhost:5173`, click **Sign up**, create an account.
2. Click **Upload** to add a note (title, subject, branch, semester, file).
3. Browse/search notes on the home page, open one to like, comment, or download.
4. **My notes** shows everything you've uploaded, with delete access.

## API overview

| Method | Route                        | Auth | Description                     |
|--------|-------------------------------|------|----------------------------------|
| POST   | /api/auth/register             | –    | Create account                   |
| POST   | /api/auth/login                | –    | Log in                           |
| GET    | /api/auth/me                   | ✓    | Current user                     |
| PUT    | /api/auth/me                   | ✓    | Update profile                   |
| GET    | /api/notes                     | –    | List/search/filter notes         |
| POST   | /api/notes                     | ✓    | Upload a note (multipart/form)   |
| GET    | /api/notes/:id                 | –    | Note detail + comments           |
| PUT    | /api/notes/:id                 | ✓    | Edit note metadata (owner)       |
| DELETE | /api/notes/:id                 | ✓    | Delete note (owner/admin)        |
| GET    | /api/notes/:id/download        | –    | Download file, increments count  |
| PUT    | /api/notes/:id/like            | ✓    | Toggle like                      |
| PUT    | /api/notes/:id/bookmark         | ✓    | Toggle bookmark                  |
| POST   | /api/notes/:id/comments         | ✓    | Add comment                      |
| GET    | /api/notes/mine/all             | ✓    | Notes uploaded by current user   |
| DELETE | /api/comments/:commentId        | ✓    | Delete a comment (owner/admin)   |

## Notes on scaling this further

- Swap local Multer disk storage for S3/Cloudinary in `server/middleware/upload.js`
  and `server/controllers/noteController.js` if you deploy somewhere without
  persistent disk (e.g. most PaaS free tiers).
- Add rate limiting (`express-rate-limit`) and helmet for production hardening.
- Add pagination-aware infinite scroll on the frontend if your note count grows large.
- Add an admin moderation panel using the existing `role: "admin"` field on User.
