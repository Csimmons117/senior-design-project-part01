# AI Fitness Helper Integration Guide

This guide explains how the AI Fitness Helper is integrated with the main Student Recreation Center website.

## Overview

The AI Fitness Helper is a React-based application that has been linked to the main website through a dedicated page that embeds the React app in an iframe.

## Architecture

- **Main Website**: Static HTML pages (index.html, html_files/*.html)
- **AI Fitness Helper Frontend**: React app (Vite) running on `http://localhost:5173` in development
- **AI Fitness Helper Backend**: Express server running on `http://localhost:4000`
- **Production Goal**: Serve both your website + AI trainer from the same public domain

## How to Access

1. Navigate to any page on the main website
2. Click on **"AI Fitness Helper"** in the navigation menu
3. You'll be redirected to `html_files/aiTrainer.html` which embeds the AI app

## Setup Instructions

### Prerequisites
- Node.js installed (v16 or higher recommended)
- npm or yarn package manager

### Starting the AI Fitness Helper

You need to run **two separate servers**:

#### 1. Start the Backend Server (Port 4000)

```bash
cd ai-personal-trainer/server
npm install  # First time only
npm start
```

The server will start on `http://localhost:4000`

#### 2. Start the Frontend React App (Port 5173)

In a **new terminal**:

```bash
cd ai-personal-trainer
npm install  # First time only
npm run dev
```

The React app will start on `http://localhost:5173`

### Starting the Main Website

The main website is static HTML and can be opened directly:

- **Option 1**: Open `index.html` directly in your browser (file:// protocol)
- **Option 2**: Use a simple HTTP server:
  ```bash
  # Using Python
  python -m http.server 8000
  
  # Using Node.js http-server
  npx http-server -p 8000
  ```

## Features

### Navigation Integration
- All pages now include an "AI Fitness Helper" link in the navigation menu
- The link appears between "Registration" and "Login"

### Embedded Experience
- The AI Fitness Helper loads in a full-screen iframe
- Includes a "Back to Main Site" button for easy navigation
- Shows loading state while the app initializes
- Displays helpful error message if the AI app isn't running

### CORS Configuration
The backend server now supports environment-driven CORS:
- Local defaults for localhost development
- `FRONTEND_URL` for your main frontend URL
- `ALLOWED_ORIGINS` for additional production domains/origins (comma separated)

This allows local development and public deployment using your domain without changing source code.

## Testing the Integration

1. **Start both AI servers** (backend on 4000, frontend on 5173)
2. **Open the main website** (either via file:// or HTTP server)
3. **Click "AI Fitness Helper"** in the navigation
4. **Verify**:
   - The AI chat interface loads properly
   - You can sign up / log in
   - The chat functionality works
   - The "Back to Main Site" button returns you to the homepage

## Troubleshooting

### "AI Fitness Helper Not Running" Error
- Make sure both servers are running (ports 4000 and 5173)
- Check terminal for any error messages
- Verify ports aren't already in use

### CORS Errors
- Ensure the backend server is running on port 4000
- Check that CORS origins include your access method (localhost or file://)

### Iframe Not Loading
- Check browser console for errors
- Verify the React app is accessible at `http://localhost:5173`
- Some browsers block mixed content (HTTP in HTTPS page)

## Files Modified

1. **index.html** - Added AI Fitness Helper navigation link
2. **html_files/staffMember.html** - Added navigation link
3. **html_files/events.html** - Added navigation link
4. **html_files/login.html** - Added navigation link
5. **html_files/signUp.html** - Added navigation link
6. **html_files/aiTrainer.html** - New page that embeds the AI app
7. **ai-personal-trainer/server/server.js** - Updated CORS settings to support production origins via env vars
8. **ai-personal-trainer/vite.config.js** - Added env-driven base path and API proxy target
9. **ai-personal-trainer/.env.production.example** - Frontend production environment template
10. **ai-personal-trainer/server/.env.production.example** - Backend production environment template

---

## Production Deployment (Public Domain)

Use this exact model so your local AI trainer setup also works publicly when deployed.

### Target URL Layout

- Main site: `https://yourdomain.com/`
- AI trainer frontend: `https://yourdomain.com/ai-personal-trainer/`
- AI trainer backend API: `https://yourdomain.com/api/...`

The AI embed page (`html_files/aiTrainer.html`) now resolves automatically:
- Local: `http://localhost:5173`
- Public domain: `/ai-personal-trainer/`

### 1) Build Frontend for Production

From `ai-personal-trainer/`:

```bash
# Create ai-personal-trainer/.env.production from the example
npm install
npm run build
```

Set in `ai-personal-trainer/.env.production`:

```env
VITE_APP_BASE=/ai-personal-trainer/
VITE_API_BASE=https://yourdomain.com
```

Deploy the generated `ai-personal-trainer/dist` contents to your server path mapped to:

`https://yourdomain.com/ai-personal-trainer/`

### 2) Run Backend API on Server

From `ai-personal-trainer/server/`:

```bash
# Create ai-personal-trainer/server/.env from the production example
npm install
node server.js
```

Set in `ai-personal-trainer/server/.env`:

```env
NODE_ENV=production
PORT=4000
JWT_SECRET=replace-with-strong-secret
FRONTEND_URL=https://yourdomain.com/ai-personal-trainer
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3) Reverse Proxy (Nginx Example)

Serve static frontend + route API to Node backend:

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    # Main site root
    root /var/www/main-site;
    index index.html;

    # Main website
    location / {
        try_files $uri $uri/ =404;
    }

    # AI trainer static build
    location /ai-personal-trainer/ {
        alias /var/www/ai-personal-trainer/dist/;
        try_files $uri $uri/ /ai-personal-trainer/index.html;
    }

    # API to Express backend
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4) Keep Backend Running

Use a process manager (recommended):

```bash
npm install -g pm2
pm2 start server.js --name ai-trainer-api
pm2 save
pm2 startup
```

### 5) Verify Public Deployment

1. Open `https://yourdomain.com/html_files/aiTrainer.html`
2. Confirm iframe loads AI trainer app
3. Confirm login/signup and chat work
4. Confirm API health endpoint: `https://yourdomain.com/api/health`

## Next Steps

- Set up HTTPS certificates (Let's Encrypt)
- Move secrets to secure environment management
- Implement single sign-on (SSO) between main site and AI app
- Add user session persistence across both applications

