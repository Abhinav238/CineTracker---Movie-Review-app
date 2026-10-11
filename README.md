# CineTracker

CineTracker is a full-stack movie discovery app. Browse rotating movie recommendations, search the OMDb catalog, save favourites to a wishlist, and share reviews with other users.

## Features

- Rotating home-page recommendations
- Movie search and detail views powered by the OMDb API
- User registration, login, and logout
- Personal movie wishlist
- Create, edit, and delete your own reviews
- Light and dark themes
- Responsive layout for desktop and mobile

## Tech stack

- Frontend: HTML, CSS, and vanilla JavaScript
- Backend: Node.js and Express
- Database: MySQL
- Authentication: JSON Web Tokens stored in HTTP-only cookies
- Movie data: [OMDb API](https://www.omdbapi.com/)

## Project structure

```text
Movie review app/
├── frontend/                 # Static client application
│   ├── index.html
│   ├── script.js
│   └── style.css
├── backend/                  # Express API
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

## Getting started

### 1. Install the backend dependencies

```bash
cd backend
npm install
```

### 2. Create the environment file

Create `backend/.env`. Do not commit this file—it is already ignored by Git.

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cinetracker
JWT_SECRET=replace_with_a_long_random_value
SESSION_SECRET=replace_with_another_long_random_value
```

### 3. Prepare MySQL

Create a MySQL database named `cinetracker` and add tables for users, wishlists, and reviews. The application expects the review table to include an `id`, `user_id`, `movie_id`, `rating`, `review_text`, and `created_at` column.

### 4. Start the API

```bash
cd backend
node server.js
```

The backend runs at `http://localhost:5000` by default.

### 5. Open the frontend

Serve the `frontend` folder with a local static server, such as the VS Code Live Server extension, then open `index.html` in your browser. The app supports `localhost` and `127.0.0.1` during local development.

## API overview

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/register` | Create an account |
| `POST` | `/api/login` | Sign in |
| `POST` | `/api/logout` | Sign out |
| `GET` | `/api/auth-status` | Check login status |
| `GET/POST` | `/api/wishlist` | Read or update the wishlist |
| `DELETE` | `/api/wishlist/:movieId` | Remove a wishlist item |
| `GET/POST` | `/api/reviews/:movieId` and `/api/reviews` | Read or create reviews |
| `PUT/DELETE` | `/api/reviews/:reviewId` | Edit or delete your review |

## Git hygiene

The included `.gitignore` prevents dependency folders, `.env` secrets, logs, generated files, database exports, and local editor files from being committed. Commit `backend/package.json` and `backend/package-lock.json`; other developers can restore dependencies by running `npm install`.

## Security note

Never commit API keys, database passwords, or JWT secrets. If a secret was previously pushed to GitHub, replace it immediately and remove it from the repository history if it was exposed publicly.
