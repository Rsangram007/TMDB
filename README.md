# TMDB Platform

A full-stack movie discovery and tracking application built with the MERN stack. Browse, search, and manage your favorite movies using data from The Movie Database (TMDB) API.

## Features

- **User Authentication** — Register, login, and JWT-based secure sessions
- **Movie Discovery** — Browse popular, trending movies and search by title
- **Movie Details** — View detailed info including cast, crew, videos, and similar movies
- **Favorites & Watchlist** — Save movies to your personal favorites and watchlist
- **Genre Filtering** — Browse movies by genre
- **Responsive UI** — Modern React frontend with Tailwind CSS and shadcn/ui components
- **API Security** — Rate limiting, Helmet headers, and CORS protection
- **Caching** — Redis integration for performance
- **RESTful API** — Complete Postman collection included

## Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Redis** for caching
- **Axios** for TMDB API calls
- **Helmet** & **express-rate-limit** for security

### Frontend
- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** + **shadcn/ui**
- **React Router DOM**
- **React Hook Form** + **Zod** validation
- **Lucide React** icons
- **Axios** for API calls

### External APIs
- **TMDB API** — Movie data, search, trending, genres

## Project Structure

```
TMDB/
├── Backend/
│   ├── models/           # Mongoose schemas (User, Movie)
│   ├── routes/           # API routes (auth, tmdb, user)
│   ├── server.js         # Express server entry point
│   ├── package.json      # Backend dependencies
│   └── TMDB-Platform-API.postman_collection.json
├── Frontend/             # React + Vite + TypeScript app
│   ├── src/              # Source code
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
└── README.md
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create new account |
| POST | `/login` | Login and get JWT token |
| GET | `/me` | Get current user (protected) |

### TMDB (`/api/tmdb`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/movies/popular` | Get popular movies |
| GET | `/movies/:id` | Get movie details + save to DB |
| GET | `/search/movies` | Search movies by query |
| GET | `/trending/movies` | Get trending movies |
| GET | `/genres/movie` | Get all movie genres |
| GET | `/movies/genre/:genreId` | Get movies by genre |
| GET | `/people/popular` | Get popular actors |

### User (`/api/user` — requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/favorites` | Add movie to favorites |
| DELETE | `/favorites/:movieId` | Remove from favorites |
| POST | `/watchlist` | Add movie to watchlist |
| DELETE | `/watchlist/:movieId` | Remove from watchlist |
| GET | `/favorites` | Get user's favorites |
| GET | `/watchlist` | Get user's watchlist |
| PUT | `/profile` | Update profile |

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)
- TMDB API key ([get one here](https://www.themoviedb.org/settings/api))
- Redis (optional, for caching)

### 1. Clone the Repository
```bash
git clone https://github.com/Rsangram007/react-delight.git
cd react-delight
```

### 2. Backend Setup
```bash
cd Backend
cp .env.example .env   # Create your .env file
npm install
npm run dev             # Starts on http://localhost:5000
```

**Backend `.env` example:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/tmdb-platform
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
TMDB_API_KEY=your_tmdb_bearer_token
TMDB_BASE_URL=https://api.themoviedb.org/3
REDIS_URL=redis://localhost:6379
CLIENT_URL=http://localhost:5173
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
npm run dev             # Starts on http://localhost:5173
```

## Postman Collection

Import `Backend/TMDB-Platform-API.postman_collection.json` into Postman for testing all endpoints.

## Scripts

### Backend
| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm test` | Run Jest tests |

### Frontend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Security Features

- Password hashing with bcrypt (salt rounds: 12)
- JWT token authentication
- Rate limiting (100 requests per 15 min per IP)
- Helmet security headers
- CORS configured for allowed origins
- Input validation with validator.js

## License

MIT

## Author

[Rsangram007](https://github.com/Rsangram007)
