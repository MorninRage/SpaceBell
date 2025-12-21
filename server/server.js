// Simple Node.js Leaderboard Server for Beyond Bell Game
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// For Render free tier - handle spin-down gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

// Middleware
app.use(cors()); // Allow all origins for game access
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files if needed

// Initialize leaderboard file if it doesn't exist
if (!fs.existsSync(LEADERBOARD_FILE)) {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([]), 'utf8');
}

// Helper functions
function readLeaderboard() {
    try {
        const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading leaderboard:', error);
        return [];
    }
}

function writeLeaderboard(leaderboard) {
    try {
        fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing leaderboard:', error);
        return false;
    }
}

function sortLeaderboard(leaderboard) {
    return leaderboard.sort((a, b) => {
        // Sort by score (descending), then by level (descending)
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return b.level - a.level;
    });
}

// Routes

// GET leaderboard - returns top 10 scores
app.get('/api/leaderboard', (req, res) => {
    const leaderboard = readLeaderboard();
    const sorted = sortLeaderboard(leaderboard);
    const top10 = sorted.slice(0, 10);
    
    res.json({
        success: true,
        leaderboard: top10,
        total: leaderboard.length
    });
});

// POST score - submit a new score
app.post('/api/leaderboard', (req, res) => {
    const { name, score, level } = req.body;
    
    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Name is required'
        });
    }
    
    if (typeof score !== 'number' || score < 0) {
        return res.status(400).json({
            success: false,
            error: 'Valid score is required'
        });
    }
    
    if (typeof level !== 'number' || level < 1) {
        return res.status(400).json({
            success: false,
            error: 'Valid level is required'
        });
    }
    
    const leaderboard = readLeaderboard();
    
    // Check if player already exists
    const existingIndex = leaderboard.findIndex(entry => entry.name === name.trim());
    
    const entry = {
        name: name.trim().substring(0, 20), // Limit name length
        score: Math.max(score, existingIndex >= 0 ? leaderboard[existingIndex].score : 0),
        level: Math.max(level, existingIndex >= 0 ? leaderboard[existingIndex].level : 0),
        date: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
        // Update existing entry if new score/level is better
        if (score > leaderboard[existingIndex].score || 
            (score === leaderboard[existingIndex].score && level > leaderboard[existingIndex].level)) {
            leaderboard[existingIndex] = entry;
        } else {
            // Keep existing if it's better
            entry.score = leaderboard[existingIndex].score;
            entry.level = leaderboard[existingIndex].level;
        }
    } else {
        // Add new entry
        leaderboard.push(entry);
    }
    
    // Sort and keep top 50 (store more than top 10 for history)
    const sorted = sortLeaderboard(leaderboard);
    const top50 = sorted.slice(0, 50);
    
    if (writeLeaderboard(top50)) {
        res.json({
            success: true,
            message: 'Score submitted successfully',
            entry: entry,
            rank: sorted.findIndex(e => e.name === entry.name) + 1
        });
    } else {
        res.status(500).json({
            success: false,
            error: 'Failed to save score'
        });
    }
});

// GET top score and level
app.get('/api/leaderboard/top', (req, res) => {
    const leaderboard = readLeaderboard();
    const sorted = sortLeaderboard(leaderboard);
    
    if (sorted.length === 0) {
        return res.json({
            success: true,
            topScore: 0,
            topLevel: 1
        });
    }
    
    res.json({
        success: true,
        topScore: sorted[0].score,
        topLevel: sorted[0].level
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Beyond Bell Leaderboard Server running on port ${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  GET  /api/leaderboard - Get top 10 scores`);
    console.log(`  POST /api/leaderboard - Submit a score`);
    console.log(`  GET  /api/leaderboard/top - Get top score and level`);
    console.log(`  GET  /api/health - Health check`);
});

