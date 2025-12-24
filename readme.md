# Beyond Bell: The Game

An interactive HTML5 game demonstrating the distinction between Ensemble Quantum Mechanics, Individual System Models, and Bell's Theorem.

## How to Play

1. **Open `index.html`** in any modern web browser
2. **Click** on the canvas to create systems
3. **Switch modes** using buttons or keyboard:
   - `1` or click "Ensemble QM" - See statistical predictions
   - `2` or click "Individual System" - See definite properties
   - `3` or click "Bell Pairs" - See correlated pairs
4. **Controls:**
   - `Space` - Pause/Resume
   - `R` - Reset
   - `Click` - Create new systems

## Game Modes

### Ensemble QM Mode
- Shows statistical/probabilistic behavior
- Cannot predict which specific systems will decay
- Demonstrates the epistemological nature of the wave function
- Systems have uncertain futures

### Individual System Mode
- Each system has a **definite decay time**
- You can see exactly when each system will decay
- Demonstrates what a complete theory would provide
- Shows ontological description of individual systems

### Bell Pairs Mode
- Shows correlated pairs (A and B)
- Demonstrates how correlations behave differently
- Shows why Bell's theorem requires pairs, not individual systems
- Watch how pairs are connected

## Educational Purpose

This game visualizes the key argument:
- **Ensemble QM**: Statistical predictions (epistemological tool)
- **Individual Systems**: Definite properties (ontological description)
- **Bell's Theorem**: Requires correlated pairs, not individual systems

## Technical Details

- Pure HTML5 Canvas and JavaScript
- No external dependencies
- Responsive design
- Real-time physics simulation
- Boss logic: for the level 60 Cell Membrane boss, destroyed membranes are removed from collision, damage gates are reinforced with per-part `canTakeDamage`, and a soft-lock fail-safe advances the phase if no progress is detected (outer → inner → nucleus). A UI-only boss debug overlay exists for troubleshooting but is disabled by default.
- Debug overlay: a lightweight, UI-only boss debug overlay can be toggled by setting `this.showBossDebugOverlay = true` in `SpaceShooterGame` (e.g., near its initialization). By default it’s off; when enabled it renders top-right during boss fights and shows bossEnemies count, puzzle flags, and per-part health/canTakeDamage. It has no gameplay impact.

## Deployment

Simply upload the `index.html` and `game.js` files to any web server, or open `index.html` directly in a browser.

For Netlify deployment, drag the entire `bell-game` folder to Netlify.

Offline: The in-game "Download Game" button now prefers a prebuilt archive `beyond-bell-offline.zip` (checked into the repo) that contains the entire project, including `index.html` and `index-dev.html`. If that ZIP is unavailable, it falls back to building a ZIP in-browser. When hosted, the site also registers a service worker to cache assets after your first visit so you can reopen the game offline. The leaderboard stays offline-only unless you configure `API_URL` in `config.js`.



















