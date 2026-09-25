# Chat Application

A modern, real-time web chat application built with **FastAPI**, **React 19**, **WebSockets**, **PostgreSQL**, and **Docker**.

---

## 🚀 Key Features

- **Real-Time Communication**: WebSocket-powered real-time messaging for instant delivery.
- **User Authentication**: Secure user authentication and session management.
- **Direct & Group Messaging**: Support for 1-on-1 private conversations and group chat channels.
- **Interactive UI**: Responsive user interface crafted with **React 19**, **Tailwind CSS v4**, and **Three.js** visual effects.
- **State Management**: Robust client state management using **Redux Toolkit** and **Redux Persist**.
- **Database & Migrations**: Relational storage with **PostgreSQL**, managed via **SQLAlchemy** and **Alembic** migrations.
- **Containerized Infrastructure**: Fully orchestrated microservices deployment using **Docker Compose** and **Nginx** reverse proxy.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **State Management**: Redux Toolkit, Redux Persist
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **3D / Graphics**: Three.js

### Backend
- **Framework**: FastAPI (Python 3)
- **Real-time**: WebSockets
- **Database ORM**: SQLAlchemy & Alembic
- **Server**: Uvicorn / Gunicorn
- **Authentication**: OAuth & JWT / Session Middleware

### Infrastructure
- **Database**: PostgreSQL 16
- **Proxy**: Nginx (handling HTTP, REST API, WebSocket proxying, and Swagger UI)
- **Containerization**: Docker & Docker Compose

---

## 📂 Project Structure

```text
chat-application/
├── backend/                  # FastAPI Application
│   ├── app/                  # Application modules (routes, core, models, websocket)
│   ├── migrations/           # Alembic database migration scripts
│   ├── main.py               # FastAPI entrypoint & middleware setup
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Backend Dockerfile
├── frontend/                 # React 19 Frontend Application
│   ├── src/                  # Components, routes, state management
│   ├── public/               # Static assets
│   ├── package.json          # Node.js dependencies & scripts
│   └── Dockerfile            # Frontend Dockerfile
├── nginx/                    # Nginx Reverse Proxy Configuration
│   └── nginx.conf            # Proxy routing for REST, WS, Docs & Static assets
├── docker-compose.yml        # Container orchestration configuration
├── commands.txt              # Helpful execution and container commands
└── README.md                 # Project documentation
```

---

## 🚦 Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- [Docker](https://www.docker.com/) and **Docker Compose**
- *(Optional for local dev)* [Python 3.10+](https://www.python.org/) & [Node.js 18+](https://nodejs.org/)

---

### Running with Docker Compose (Recommended)

To launch all services (PostgreSQL, Backend, Frontend, and Nginx) concurrently:

```bash
docker compose up --build
```

Once running, access the services at:

- **Web Application**: `http://localhost`
- **Interactive API Docs (Swagger)**: `http://localhost/docs`
- **OpenAPI Schema**: `http://localhost/openapi.json`

---

### Local Development Setup

If you prefer to run services individually for development:

#### 1. Database Setup
Start a PostgreSQL instance locally or use Docker:
```bash
docker run -d --name chat-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=chat_app -p 5432:5432 postgres:16
```

#### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development server
uvicorn main.py:app --reload --port 8000
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 🌐 Nginx Route Overview

| Route | Target Service | Description |
| :--- | :--- | :--- |
| `/` | `frontend:80` | Serves the React frontend web application |
| `/api/` | `backend:8000/api/` | REST API endpoints for Auth, Users, Messages & Groups |
| `/api/ws/` | `backend:8000/api/ws/` | WebSocket connection endpoints for real-time messaging |
| `/docs` | `backend:8000/docs` | FastAPI Swagger API documentation |
| `/openapi.json` | `backend:8000/openapi.json` | OpenAPI Specification |

---

## 🧪 Production Server Commands

To run the backend with Gunicorn and Uvicorn workers in production:

```bash
gunicorn --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 main:app
```

---

## 📝 License

This project is open-source and available under the standard development guidelines.
