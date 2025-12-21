# Beyond Bell Leaderboard Server

Simple Node.js backend for the Beyond Bell game leaderboard.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### GET /api/leaderboard
Returns top 10 scores.

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "name": "Player1",
      "score": 1000,
      "level": 5,
      "date": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10
}
```

### POST /api/leaderboard
Submit a new score.

**Request Body:**
```json
{
  "name": "Player1",
  "score": 1000,
  "level": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Score submitted successfully",
  "entry": { ... },
  "rank": 1
}
```

### GET /api/leaderboard/top
Get the top score and level.

**Response:**
```json
{
  "success": true,
  "topScore": 1000,
  "topLevel": 5
}
```

## Deployment

### Option 1: Deploy to Heroku
1. Create a Heroku app
2. Set up Git and push
3. Heroku will auto-detect Node.js and install dependencies

### Option 2: Deploy to Railway
1. Connect your GitHub repo
2. Railway auto-deploys

### Option 3: Deploy to Render
1. Create new Web Service
2. Connect repo
3. Set build command: `npm install`
4. Set start command: `npm start`

### Option 4: Deploy to VPS
1. Install Node.js on your server
2. Clone repo
3. Run `npm install`
4. Use PM2 or systemd to keep it running

## Environment Variables

- `PORT` - Server port (default: 3000)

## CORS

Currently allows all origins. For production, you may want to restrict this to your Netlify domain.


















