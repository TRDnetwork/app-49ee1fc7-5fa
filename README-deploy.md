# TaskFlow Dark - Deployment Guide

This guide covers deploying the TaskFlow Dark application. The app consists of a static frontend (HTML/CSS/JS) and a lightweight Express backend API.

## Prerequisites

- **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: [Install Docker Compose](https://docs.docker.com/compose/install/)
- **Node.js 20+** (for local development without Docker)
- **npm** or **yarn**

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
PORT=3001
NODE_ENV=production
```

## Deploy with Docker

1. **Build the Docker image:**
   ```bash
   docker build -t taskflow-dark .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3001:3001 --env-file .env --name taskflow-dark taskflow-dark
   ```

3. **Verify the deployment:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok","message":"TaskFlow Dark API is running"}`

## Deploy with Docker Compose

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

## Deploy to Railway

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize and deploy:**
   ```bash
   railway init
   railway up
   ```

4. **Set environment variables in Railway dashboard:**
   - `PORT`: 3001
   - `NODE_ENV`: production

## Deploy to Render

1. **Create a new Web Service** on [Render Dashboard](https://dashboard.render.com)

2. **Connect your GitHub/GitLab repository**

3. **Configure the service:**
   - **Build Command:** `npm ci --only=production`
   - **Start Command:** `node server.js`
   - **Environment Variables:**
     - `PORT`: 3001
     - `NODE_ENV`: production

4. **Click "Create Web Service"**

## Local Development (Without Docker)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   ```

3. **Run the backend:**
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Serve the frontend:**
   Open `index.html` directly in a browser or use a simple HTTP server:
   ```bash
   npx serve .
   ```

## Testing

Before deploying, run the test suite:

```bash
npm test
```

## Health Checks

The application includes a health check endpoint:
- **URL:** `GET /api/health`
- **Expected Response:** `{"status":"ok","message":"TaskFlow Dark API is running"}`

## Notes

- The frontend is static HTML/CSS/JS and can be served from any web server
- The backend API runs on port 3001 by default
- For production, consider using a reverse proxy (nginx) for SSL termination
- The current implementation uses localStorage in the frontend; the backend is for future expansion

## Troubleshooting

**Container fails to start:**
- Check if port 3001 is already in use: `lsof -i :3001`
- Verify environment variables are set correctly

**Health check fails:**
- Ensure the backend is running: `docker ps`
- Check logs: `docker logs taskflow-dark`

**Frontend doesn't connect to backend:**
- Update the API URL in `app.js` if backend is hosted elsewhere
- Ensure CORS is properly configured if domains differ