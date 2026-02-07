# All-in-One Productivity System

A comprehensive productivity application built with Django REST API backend and React TypeScript frontend.

## Tech Stack

### Backend
- Django 5.0
- Django REST Framework (DRF)
- PostgreSQL 15 with pgvector extension
- Redis for caching and Celery
- JWT Authentication (djangorestframework-simplejwt)
- API Documentation (drf-spectacular)

### Frontend
- React 18 with TypeScript
- Vite as build tool
- Tailwind CSS for styling
- shadcn/ui components
- Zustand for state management
- React Router for navigation
- Axios for API calls

## Project Structure

```
.
├── backend/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py          # Shared settings
│   │   │   ├── development.py   # Local dev settings
│   │   │   └── production.py    # Production settings
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── apps/
│   │   └── core/
│   │       ├── models.py        # User, UserProfile, UserPreferences
│   │       ├── serializers.py
│   │       ├── views.py
│   │       ├── urls.py
│   │       └── admin.py
│   ├── requirements/
│   │   ├── base.txt
│   │   └── development.txt
│   ├── Dockerfile
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/ui/
│   │   ├── lib/
│   │   ├── stores/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types/
│   ├── package.json
│   ├── Dockerfile
│   └── vite.config.ts
├── docker-compose.yml
├── .env
└── README.md
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd all-in-one-productivity
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Start all services:
```bash
docker-compose up --build
```

4. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1
- API Documentation: http://localhost:8000/api/docs/
- Django Admin: http://localhost:8000/admin/

### Local Development

#### Backend Setup

1. Create virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements/development.txt
```

3. Set up database (requires PostgreSQL and Redis):
```bash
# Ensure PostgreSQL and Redis are running
python manage.py migrate
python manage.py createsuperuser
```

4. Run development server:
```bash
python manage.py runserver
```

#### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register/` - User registration
- `POST /api/v1/auth/login/` - JWT token obtain
- `POST /api/v1/auth/refresh/` - Token refresh
- `POST /api/v1/auth/logout/` - Token blacklist
- `GET /api/v1/auth/me/` - Current user info
- `PATCH /api/v1/auth/me/` - Update current user
- `POST /api/v1/auth/change-password/` - Change password

### User
- `GET /api/v1/auth/me/profile/` - Get user profile
- `PATCH /api/v1/auth/me/profile/` - Update user profile
- `GET /api/v1/auth/me/preferences/` - Get user preferences
- `PATCH /api/v1/auth/me/preferences/` - Update user preferences

## Features Implemented

### Phase 1: Foundation & Core Infrastructure ✅
- [x] Django 5 project with DRF setup
- [x] PostgreSQL with pgvector extension
- [x] React 18 + TypeScript + Vite frontend
- [x] Tailwind CSS + shadcn/ui components
- [x] JWT authentication system
- [x] User models (User, UserProfile, UserPreferences)
- [x] Docker Compose environment
- [x] API versioning (/api/v1/)
- [x] Pagination and filtering
- [x] CORS configuration
- [x] API documentation (OpenAPI/Swagger)
- [x] Authentication pages (Login, Register)
- [x] Protected routes
- [x] Dashboard and Profile pages

## Security Notes

- JWT tokens expire in 15 minutes (access) and 7 days (refresh)
- Passwords are hashed using Django's default PBKDF2
- CORS is configured for specific origins
- Use a strong `SECRET_KEY` in production

## Development

### Backend Commands

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
pytest

# Collect static files
python manage.py collectstatic

# Create new app
python manage.py startapp app_name apps/
```

### Frontend Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Troubleshooting

### Database Connection Issues
Ensure PostgreSQL is running and accessible. Check the `DATABASE_URL` in `.env`.

### Frontend API Connection
Ensure the backend is running and `VITE_API_URL` is set correctly in `.env`.

### Docker Issues
```bash
# Rebuild containers
docker-compose up --build --force-recreate

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# View logs
docker-compose logs -f <service>
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Follow existing code style
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
