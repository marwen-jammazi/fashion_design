# Fashion Designer Portfolio (MERN)

A full-stack portfolio website for a fashion designer. Visitors browse collections and individual looks, read about the designer, and send her a message. The designer logs in to manage everything: collections, projects, images, her profile and incoming messages.

**Stack:** MongoDB Atlas, Express, React (Vite), Node.js, plus Cloudinary for image hosting and JWT for admin authentication.

---

## Table of contents

1. [How it works](#how-it-works)
2. [Project structure](#project-structure)
3. [Data models](#data-models)
4. [API reference](#api-reference)
5. [Getting started](#getting-started)
6. [Environment variables](#environment-variables)
7. [Authentication flow](#authentication-flow)
8. [Image upload flow](#image-upload-flow)
9. [Frontend pages](#frontend-pages)
10. [Security notes](#security-notes)
11. [Troubleshooting](#troubleshooting)
12. [Roadmap](#roadmap)

---

## How it works

```
 Visitor / Admin browser
          |
          v
  React app (Vite, port 5173)
          |   axios requests to /api/...
          v
  Express API (port 5000)  ----->  MongoDB Atlas  (data)
          |
          +------------------->  Cloudinary       (image files)
```

- The **React frontend** is what visitors see. It fetches data from the API and renders pages.
- The **Express backend** exposes a REST API under `/api`. Reading data is public. Creating, editing and deleting requires an admin token.
- **MongoDB Atlas** stores text data: collections, projects, profile, messages and the admin account.
- **Cloudinary** stores the actual image files. The database only stores each image's `url` and `publicId`.
- There is **one admin account** (the designer). There is no public registration route. The account is created once with a seed script.

---

## Project structure

```
enawnaw/
├── backend/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── cloudinary.js          # Cloudinary configuration
│   ├── controllers/
│   │   ├── authController.js      # login, get current admin
│   │   ├── collectionController.js
│   │   ├── projectController.js
│   │   ├── uploadController.js    # upload/delete images
│   │   ├── messageController.js   # contact form messages
│   │   └── profileController.js   # About / bio
│   ├── middleware/
│   │   ├── auth.js                # protect: verifies JWT
│   │   ├── upload.js              # multer (file parsing, size/type limits)
│   │   └── errorHandler.js        # notFound + central error handler
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Collection.js
│   │   ├── Project.js
│   │   ├── Message.js
│   │   └── Profile.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── collectionRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── uploadRoutes.js
│   │   ├── messageRoutes.js
│   │   └── profileRoutes.js
│   ├── scripts/
│   │   └── seedAdmin.js           # creates the admin account (run once)
│   ├── utils/
│   │   ├── asyncHandler.js        # forwards async errors to the error handler
│   │   └── pick.js                # whitelists fields from req.body
│   ├── .env.example
│   ├── index.js                   # app entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/client.js          # axios instance (base URL from env)
│   │   ├── components/Layout.jsx  # header, footer, <Outlet />
│   │   ├── pages/                 # Home, Collections, CollectionDetail,
│   │   │                          # ProjectDetail, About, Contact, NotFound
│   │   ├── App.jsx                # routes
│   │   ├── main.jsx               # React entry, BrowserRouter
│   │   └── index.css
│   ├── .env
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Data models

| Model | Purpose | Key fields |
|---|---|---|
| **Admin** | The designer's login | `email` (unique), `password` (bcrypt-hashed, hidden from queries by default) |
| **Collection** | A group of work, e.g. "SS26 Runway" | `title`, `slug` (auto-generated), `description`, `season`, `year`, `coverImage {url, publicId}`, `order`, `isPublished` |
| **Project** | A single look or piece | `title`, `slug` (auto-generated), `collectionId`, `description`, `images [{url, publicId, alt}]`, `tags`, `materials`, `year`, `featured`, `order`, `isPublished` |
| **Message** | Contact form submission | `name`, `email`, `subject`, `message`, `read` |
| **Profile** | About page (single document) | `name`, `tagline`, `bio`, `photo`, `email`, `location`, `social {instagram, pinterest, behance, linkedin}` |

Notes:
- **Slugs** are created automatically from the title (`"SS26 Runway"` becomes `ss26-runway`) and used in public URLs.
- **`order`** controls display order. **`isPublished`** hides work without deleting it. **`featured`** puts a project on the homepage.
- Images store `publicId` so the file can also be deleted from Cloudinary when a project is removed.

---

## API reference

Base URL (local): `http://localhost:5000/api`

🔒 = requires header `Authorization: Bearer <token>`

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check that the API is running |

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Body: `{ email, password }`. Returns `{ token, admin }`. Rate limited (10 attempts / 15 min) |
| GET 🔒 | `/auth/me` | Returns the logged-in admin |

### Collections
| Method | Endpoint | Description |
|---|---|---|
| GET | `/collections` | List published collections |
| GET | `/collections/:slug` | One collection with its projects |
| POST 🔒 | `/collections` | Create |
| PUT 🔒 | `/collections/:id` | Update |
| DELETE 🔒 | `/collections/:id` | Delete (blocked if it still contains projects) |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/projects` | List published projects. Filters: `?collection=ID`, `?featured=true`, `?tag=silk` |
| GET | `/projects/:slug` | One project |
| POST 🔒 | `/projects` | Create |
| PUT 🔒 | `/projects/:id` | Update |
| DELETE 🔒 | `/projects/:id` | Delete (also deletes its images from Cloudinary) |

### Uploads
| Method | Endpoint | Description |
|---|---|---|
| POST 🔒 | `/uploads` | `multipart/form-data`, field name `images`, up to 10 files (JPG, PNG, WEBP, max 8 MB each). Returns `[{ url, publicId, width, height }]` |
| DELETE 🔒 | `/uploads` | Body: `{ publicId }`. Removes an image from Cloudinary |

### Profile
| Method | Endpoint | Description |
|---|---|---|
| GET | `/profile` | Get the About/bio data |
| PUT 🔒 | `/profile` | Update it |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| POST | `/messages` | Send a contact message. Rate limited (5 per hour per IP), honeypot spam protection |
| GET 🔒 | `/messages` | List all messages, newest first |
| PATCH 🔒 | `/messages/:id/read` | Mark as read |
| DELETE 🔒 | `/messages/:id` | Delete |

---

## Getting started

### Prerequisites
- Node.js 18 or higher
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A free [Cloudinary](https://cloudinary.com) account
- Git

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/fashion-portfolio.git
cd fashion-portfolio

cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env      # on Windows PowerShell: Copy-Item .env.example .env
```

Fill in the values (see [Environment variables](#environment-variables)).

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Configure the frontend

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

### 4. Create the admin account (once)

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`, then:

```bash
cd backend
node scripts/seedAdmin.js
```

Expected output: `Admin created: her-email@example.com`

After this, **remove `ADMIN_PASSWORD` from `.env`**. It is stored hashed in the database and no longer needed.

### 5. Run both servers

Terminal 1 (API):
```bash
cd backend
npm run dev
```
Expected: `Server running on port 5000` and `MongoDB connected: ...`

Terminal 2 (website):
```bash
cd frontend
npm run dev
```
Open **http://localhost:5173**.

### Scripts

| Location | Command | What it does |
|---|---|---|
| backend | `npm run dev` | Start API with auto-restart (nodemon) |
| backend | `npm start` | Start API (production) |
| backend | `node scripts/seedAdmin.js` | Create the admin account |
| frontend | `npm run dev` | Start Vite dev server |
| frontend | `npm run build` | Production build into `dist/` |
| frontend | `npm run preview` | Preview the production build |

---

## Environment variables

### `backend/.env`

| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `CLIENT_URL` | Frontend origin allowed by CORS, e.g. `http://localhost:5173` |
| `MONGO_URI` | MongoDB Atlas connection string, including the database name |
| `JWT_SECRET` | Long random string used to sign tokens. Keep it secret |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `ADMIN_EMAIL` | Used only by the seed script |
| `ADMIN_PASSWORD` | Used only by the seed script. Remove after seeding |
| `CLOUDINARY_CLOUD_NAME` | From the Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From the Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From the Cloudinary dashboard |

### `frontend/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the API, e.g. `http://localhost:5000/api` |

> `.env` files are listed in `.gitignore` and must **never** be committed. `backend/.env.example` documents the variables without real values.

---

## Authentication flow

1. The designer sends her email and password to `POST /api/auth/login`.
2. The server finds the admin, compares the password with the stored bcrypt hash, and returns a signed **JWT**.
3. The client sends that token on every protected request: `Authorization: Bearer <token>`.
4. The `protect` middleware verifies the token and loads the admin. Invalid or expired tokens receive `401`.
5. Wrong email and wrong password return the same message, so attackers cannot tell which one was incorrect.

Public visitors can only **read** published content and **send a contact message**. Every write operation is protected.

---

## Image upload flow

1. The admin selects photos and the client sends them to `POST /api/uploads` (multipart form, field `images`).
2. `multer` reads the files into memory and rejects anything that is not JPG/PNG/WEBP or is over 8 MB.
3. The server streams each file to Cloudinary (folder `fashion-portfolio`).
4. The API responds with `url`, `publicId`, `width` and `height` for each image.
5. The client includes those values in the `images` array when creating or updating a project.
6. When a project is deleted, its images are deleted from Cloudinary using the stored `publicId`.

The server never stores image files on its own disk.

---

## Frontend pages

| Route | Page | Data source |
|---|---|---|
| `/` | Home: featured projects | `GET /projects?featured=true` |
| `/collections` | All collections | `GET /collections` |
| `/collections/:slug` | One collection and its projects | `GET /collections/:slug` |
| `/projects/:slug` | Project detail with image gallery | `GET /projects/:slug` |
| `/about` | About / bio | `GET /profile` |
| `/contact` | Contact form | `POST /messages` |
| `*` | 404 page | none |

Routing uses `react-router-dom`. Requests go through a shared axios instance in `src/api/client.js`.

---

## Security notes

- **Helmet** sets secure HTTP headers.
- **CORS** only allows the origin in `CLIENT_URL`.
- **Passwords** are hashed with bcrypt (cost 12) and excluded from queries by default.
- **Rate limiting** on login (10 / 15 min) and on the contact form (5 / hour).
- **Honeypot field** on the contact form catches simple bots.
- **Field whitelisting** (`pick`) means clients cannot write unexpected fields.
- **No public registration route**, so only the seeded admin can exist.
- **Upload validation** limits file type and size.
- **Secrets** live in `.env`, which is never committed.

Before going to production: use a long random `JWT_SECRET`, restrict MongoDB Atlas network access to your host's IPs, and set `NODE_ENV=production` (this hides error stack traces in responses).

---

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| `Cannot find module ...` | A file is missing or misnamed (check capitalization, e.g. `Project.js` vs `Projects.js`) |
| `next is not a function` | Mongoose hooks must not use `next`. Use `async function () {}` or `function () {}` without the parameter |
| `MongoDB connection error: bad auth` | Wrong username or password in `MONGO_URI` |
| MongoDB timeout / `ECONNREFUSED` | Your IP is not allowed in Atlas, Network Access |
| CORS error in browser | `CLIENT_URL` must exactly match the frontend origin. Restart the backend after changing `.env` |
| `401 Not authorized` | Missing, wrong or expired Bearer token. Log in again |
| `Unexpected field` on upload | The form field must be named exactly `images` |
| `Invalid cloud_name` / `Must supply api_key` | Cloudinary values missing in `.env`. Restart the server |
| Frontend shows "Could not load..." | Backend not running, or wrong `VITE_API_URL`. Restart Vite after editing `.env` |
| Pages are empty | No data yet. Create a collection and project through the API |

---

## Roadmap

- [x] Backend: models, CRUD, auth, uploads, contact form, profile
- [x] Frontend skeleton: routing and data-driven pages
- [ ] Visual design: typography, hero section, lightbox gallery, transitions
- [ ] Admin dashboard in React (login, manage collections/projects/images, read messages)
- [ ] SEO: page titles, meta tags, Open Graph images
- [ ] Email notification when a contact message arrives
- [ ] Deployment: API on Render/Railway, frontend on Vercel/Netlify, MongoDB Atlas IP restrictions

---

## License

Private project. All rights reserved.
