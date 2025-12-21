# Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Easiest - Free Tier Available)

1. Go to [railway.app](https://railway.app)
2. Sign up/login
3. Click "New Project" → "Deploy from GitHub repo"
4. Connect your repository
5. Select the `bell-game/server` folder
6. Railway auto-detects Node.js
7. Add environment variable: `PORT` = `3000` (optional)
8. Deploy!
9. Get your URL (e.g., `https://your-app.railway.app`)
10. Update `config.js` in the game with: `window.API_URL = 'https://your-app.railway.app/api'`

### Option 2: Render (Free Tier Available)

1. Go to [render.com](https://render.com)
2. Sign up/login
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Settings:
   - **Name**: bell-game-leaderboard
   - **Root Directory**: `bell-game/server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. Click "Create Web Service"
7. Get your URL
8. Update `config.js` with your Render URL

### Option 3: Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. In `bell-game/server` folder:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```
4. Get your URL
5. Update `config.js`

### Option 4: VPS (DigitalOcean, AWS, etc.)

1. SSH into your server
2. Install Node.js: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`
3. Clone your repo
4. `cd bell-game/server`
5. `npm install`
6. Use PM2: `npm install -g pm2`
7. `pm2 start server.js --name leaderboard`
8. `pm2 save`
9. Set up nginx reverse proxy (optional)
10. Update `config.js` with your server IP/domain

## After Deployment

1. Update `bell-game/config.js`:
   ```javascript
   window.API_URL = 'https://your-deployed-server.com/api';
   ```

2. Test the API:
   - Visit: `https://your-server.com/api/health`
   - Should return: `{"success":true,"message":"Server is running"}`

3. Deploy updated game to Netlify with the new `config.js`

## CORS Configuration

The server currently allows all origins. To restrict to your Netlify domain:

Edit `server.js`:
```javascript
app.use(cors({
    origin: 'https://your-netlify-site.netlify.app'
}));
```


















