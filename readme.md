# Beyond Bell: The Game

An interactive HTML5 game demonstrating the distinction between Ensemble Quantum Mechanics, Individual System Models, and Bell's Theorem.

## How to Play

1. **Open `index.html`** in any modern web browser
2. **Switch modes** using buttons or keyboard: `1` (Ensemble QM), `2` (Individual System), `3` (Bell Pairs)
3. **Controls:**
   - **Movement:** WASD or Arrow Keys
   - **Aim/Shoot:** Mouse to aim, Click or Space to shoot
   - **Tab** - Weapon wheel (equip weapons, eat food)
   - **Q** - Hammer (equip, then repair bubble)
   - **E** - Inventory | **C** - Boost | **H** - Health pack | **X** - Atom split
   - **ESC** - Pause | **R** - Restart (game over)
   - **Gamepad:** Full support - R3=Weapon wheel, L3=Hammer, LT=Boost, LB=Inventory. See in-game Tutorial for full mapping.

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
- **Performance optimizations**: Molecule rendering uses health bucket system and gradient caching (60-80% reduction in gradient creation). Particle rendering uses gradient caching for collision effects (70-85% reduction). Preshader/prerendering system for off-canvas caching of visual effects.
- **Character rendering**: High-fidelity character system with three-point lighting, realistic proportions, detailed features (35 hair strands, 7 hair spikes, 30 mustache hairs, 4 fingers per hand), and physics-based animations (breathing, hair movement, blinking). Used for Einstein and Bell characters in cutscenes.
- **Cutscenes**: Enhanced tutorial intro cutscene ("Welcome, Pilot!") with realistic deep space background, nebula clouds, quantum energy effects, high-fidelity characters, enhanced ship, and stunning animated text boxes.
- Boss logic: for the level 60 Cell Membrane boss, destroyed membranes are removed from collision, damage gates are reinforced with per-part `canTakeDamage`, and a soft-lock fail-safe advances the phase if no progress is detected (outer → inner → nucleus). A UI-only boss debug overlay exists for troubleshooting but is disabled by default.
- Debug overlay: a lightweight, UI-only boss debug overlay can be toggled by setting `this.showBossDebugOverlay = true` in `SpaceShooterGame` (e.g., near its initialization). By default it's off; when enabled it renders top-right during boss fights and shows bossEnemies count, puzzle flags, and per-part health/canTakeDamage. It has no gameplay impact.

## Deployment

Simply upload the `index.html` and `game.js` files to any web server, or open `index.html` directly in a browser.

For Netlify deployment, drag the entire `bell-game` folder to Netlify.

Offline: The in-game "Download Game" button now prefers a prebuilt archive `beyond-bell-offline.zip` (checked into the repo) that contains the entire project, including `index.html` and `index-dev.html`. If that ZIP is unavailable, it falls back to building a ZIP in-browser. When hosted, the site also registers a service worker to cache assets after your first visit so you can reopen the game offline. The leaderboard stays offline-only unless you configure `API_URL` in `config.js`.



















