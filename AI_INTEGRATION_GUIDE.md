# AI Fitness Helper Integration Guide

This guide explains how the AI Fitness Helper is integrated with the main Student Recreation Center website.

## Overview

The AI Fitness Helper is a React-based application that has been linked to the main website through a dedicated page that embeds the React app in an iframe.

## Architecture

- **Main Website**: Static HTML pages (index.html, html_files/*.html)
- **AI Fitness Helper Frontend**: React app running on `http://localhost:5173`
- **AI Fitness Helper Backend**: Express server running on `http://localhost:4000`

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
The backend server has been configured to accept requests from:
- `http://localhost:5173` (React dev server)
- `http://localhost:3000`
- `http://localhost:8000` (common HTTP server port)
- `http://localhost:80`
- `file://` protocol (for direct HTML file access)

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
7. **ai-personal-trainer/server/server.js** - Updated CORS settings
8. **ai-personal-trainer/vite.config.js** - Fixed proxy target port

## Next Steps

- Consider deploying both the main website and AI app to a production server
- Implement single sign-on (SSO) between main site and AI app
- Add user session persistence across both applications

