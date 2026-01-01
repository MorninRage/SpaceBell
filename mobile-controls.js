// Mobile Touch Controls for Beyond Bell Game
// This script adds comprehensive touch support for mobile devices (iPhone, Android, etc.)

(function() {
    'use strict';
    
    // Wait for game to be initialized
    let game = null;
    let joystickActive = false;
    let joystickTouchId = null;
    let aimButtonActive = false;
    let aimTouchId = null;
    let aimButtonStartX = 0; // Initial touch position for aim button (joystick mode)
    let aimButtonStartY = 0;
    let aimButtonStartCrosshairX = 0; // Crosshair position when aim button was pressed
    let aimButtonStartCrosshairY = 0;
    let shootButtonActive = false;
    let shootTouchId = null;
    let touchScreenStartX = 0; // Initial touch position for touch screen mode
    let touchScreenStartY = 0;
    let touchScreenStartCrosshairX = 0; // Crosshair position when touch screen was touched
    let touchScreenStartCrosshairY = 0;
    let touchScreenActive = false;
    let joystickCenterX = 0;
    let joystickCenterY = 0;
    let joystickRadius = 50;
    let joystickMaxDistance = 45; // Increased for better range
    let joystickX = 0;
    let joystickY = 0;
    let lastJoystickUpdate = 0;
    const JOYSTICK_UPDATE_INTERVAL = 16; // ~60fps
    
    // Detect if we're on a mobile device
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
               window.matchMedia('(pointer: coarse)').matches;
    }
    
    // Initialize mobile controls
    function initMobileControls() {
        if (!isMobileDevice()) {
            return; // Not a mobile device, skip mobile controls
        }
        
        // Wait for game object to be available
        const checkGame = setInterval(() => {
            if (window.game && window.game.canvas) {
                game = window.game;
                clearInterval(checkGame);
                setupMobileControls();
            }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkGame);
        }, 5000);
    }
    
    function setupMobileControls() {
        const joystick = document.getElementById('mobileJoystick');
        const joystickBase = document.getElementById('joystickBase');
        const joystickHandle = document.getElementById('joystickHandle');
        const aimButton = document.getElementById('mobileAimButton');
        const shootButton = document.getElementById('mobileShootButton');
        const pauseButton = document.getElementById('mobilePauseButton');
        
        if (!joystick || !aimButton || !shootButton) {
            console.warn('Mobile control elements not found');
            return;
        }
        
        // Show controls based on game state, not just preload state
        function updateControlVisibility() {
            const preloadOverlay = document.getElementById('preloadOverlay');
            const isPreloading = preloadOverlay && 
                                (preloadOverlay.style.display !== 'none' && 
                                 window.getComputedStyle(preloadOverlay).display !== 'none');
            
            // Always hide controls during preload (no ships on preload page)
            if (isPreloading) {
                joystick.classList.remove('active');
                aimButton.classList.remove('active');
                shootButton.classList.remove('active');
                if (pauseButton) {
                    pauseButton.classList.remove('active');
                }
                return;
            }
            
            // Check game state after preload is gone
            if (!game) {
                // Game not initialized yet, hide controls
                joystick.classList.remove('active');
                aimButton.classList.remove('active');
                shootButton.classList.remove('active');
                if (pauseButton) {
                    pauseButton.classList.remove('active');
                }
                return;
            }
            
            // Check if we're in interactive cutscene phases (WWS and SpaceBell logo pages with ships)
            const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                        game.cutsceneId === 'willsWayIntro' && 
                                        (game.cutscenePhase === 0 || game.cutscenePhase === 1);
            
            if (isInteractiveCutscene) {
                // Show only fire button during cutscene phases 0 & 1 (logo pages with ships)
                joystick.classList.remove('active');
                aimButton.classList.remove('active');
                shootButton.classList.add('active');
                if (pauseButton) {
                    pauseButton.classList.add('active');
                }
            } else if (game.gameState === 'playing') {
                // Show all controls during gameplay
                joystick.classList.add('active');
                aimButton.classList.add('active');
                shootButton.classList.add('active');
                if (pauseButton) {
                    pauseButton.classList.add('active');
                }
            } else {
                // Hide controls for other states (non-interactive cutscenes, etc.)
                joystick.classList.remove('active');
                aimButton.classList.remove('active');
                shootButton.classList.remove('active');
                if (pauseButton) {
                    pauseButton.classList.remove('active');
                }
            }
        }
        
        // Monitor game state changes - updateControlVisibility now handles everything
        if (game) {
            // Initial check immediately
            updateControlVisibility();
            
            // Also check periodically to catch state changes
            const gameStateCheck = setInterval(() => {
                updateControlVisibility();
            }, 100);
            
            // Stop checking after 30 seconds
            setTimeout(() => clearInterval(gameStateCheck), 30000);
        } else {
            // If game not ready, check periodically until it's available
            const checkGameReady = setInterval(() => {
                if (window.game && window.game.canvas) {
                    game = window.game;
                    clearInterval(checkGameReady);
                    updateControlVisibility();
                    // Start regular monitoring
                    const gameStateCheck = setInterval(() => {
                        updateControlVisibility();
                    }, 100);
                    setTimeout(() => clearInterval(gameStateCheck), 30000);
                }
            }, 200);
            setTimeout(() => clearInterval(checkGameReady), 10000);
        }
        
        // Initial check
        updateControlVisibility();
        
        // Also check after a delay to ensure everything is loaded
        setTimeout(() => {
            updateControlVisibility();
        }, 1000);
        
        // Monitor preload overlay visibility
        const preloadOverlay = document.getElementById('preloadOverlay');
        if (preloadOverlay) {
            const observer = new MutationObserver(updateControlVisibility);
            observer.observe(preloadOverlay, { 
                attributes: true, 
                attributeFilter: ['style'],
                childList: false,
                subtree: false
            });
            
            // Also check display style periodically
            const checkInterval = setInterval(() => {
                updateControlVisibility();
                // Stop checking after game starts (cutscene or playing)
                if (game && (game.gameState === 'cutscene' || game.gameState === 'playing')) {
                    clearInterval(checkInterval);
                }
            }, 100);
            
            // Stop after 10 seconds max
            setTimeout(() => clearInterval(checkInterval), 10000);
        }
        
        // Setup pause button
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                if (game && typeof game.togglePause === 'function') {
                    game.togglePause();
                }
            });
            pauseButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (game && typeof game.togglePause === 'function') {
                    game.togglePause();
                }
            }, { passive: false });
        }
        
        // Add close buttons to all UI panels
        addCloseButtonsToPanels();
        
        // Enable touch scrolling for UI panels
        enableTouchScrolling();
        
        // Get joystick position
        const updateJoystickPosition = () => {
            const rect = joystickBase.getBoundingClientRect();
            joystickCenterX = rect.left + rect.width / 2;
            joystickCenterY = rect.top + rect.height / 2;
            joystickRadius = rect.width / 2;
            joystickMaxDistance = joystickRadius * 0.6; // 60% of radius
        };
        updateJoystickPosition();
        window.addEventListener('resize', updateJoystickPosition);
        window.addEventListener('orientationchange', () => {
            setTimeout(updateJoystickPosition, 200);
        });
        
        // Initialize audio on first touch (mobile browsers require user interaction)
        let audioInitialized = false;
        const initAudioOnFirstTouch = () => {
            if (!audioInitialized && game && game.audio && typeof game.audio.init === 'function') {
                game.audio.init();
                // Try to play pending music if any
                if (game.audio.pendingMusic) {
                    game.audio.pendingMusic.play().catch(() => {});
                    game.audio.pendingMusic = null;
                }
                // If game is already playing and music should be playing, try to start it
                if (game.gameState === 'playing' && !game.cutsceneId && !game.isPaused) {
                    // Check if main music should be playing
                    if (game.audio.currentMusic === 'main' && !game.audio.currentMusicElement) {
                        if (typeof game.startMainMusicIfAllowed === 'function') {
                            game.startMainMusicIfAllowed({ fadeIn: true });
                        }
                    }
                    // If no music is set, start main music
                    else if (!game.audio.currentMusic) {
                        if (typeof game.startMainMusicIfAllowed === 'function') {
                            game.startMainMusicIfAllowed({ fadeIn: true });
                        }
                    }
                }
                audioInitialized = true;
            }
        };
        
        // Monitor game state to start music when gameplay begins
        // This ensures music starts even if audio was initialized during cutscenes
        let musicStartMonitor = null;
        if (game) {
            musicStartMonitor = setInterval(() => {
                if (game && game.audio && audioInitialized) {
                    // When game transitions to playing state, start main music if not already playing
                    if (game.gameState === 'playing' && !game.cutsceneId && !game.isPaused) {
                        if (!game.audio.currentMusicElement && 
                            (game.audio.currentMusic === 'main' || !game.audio.currentMusic)) {
                            if (typeof game.startMainMusicIfAllowed === 'function') {
                                game.startMainMusicIfAllowed({ fadeIn: true });
                            }
                        }
                    }
                }
            }, 1000); // Check every second
            // Stop monitoring after 60 seconds (game should have started by then)
            setTimeout(() => {
                if (musicStartMonitor) {
                    clearInterval(musicStartMonitor);
                    musicStartMonitor = null;
                }
            }, 60000);
        }
        
        // Improved joystick touch handlers with better tracking
        let joystickTouchStartX = 0;
        let joystickTouchStartY = 0;
        
        joystickBase.addEventListener('touchstart', (e) => {
            initAudioOnFirstTouch(); // Initialize audio on first touch
            e.preventDefault();
            // Don't stop propagation - allow other touches to work simultaneously
            if (joystickTouchId === null) {
                const touch = e.touches[0];
                joystickTouchId = touch.identifier;
                joystickActive = true;
                updateJoystickPosition();
                joystickTouchStartX = touch.clientX;
                joystickTouchStartY = touch.clientY;
                updateJoystick(touch.clientX, touch.clientY);
            }
        }, { passive: false });
        
        // Track touches anywhere on screen for joystick and aim button
        // Support multiple simultaneous touches (joystick, aim, fire all at once)
        document.addEventListener('touchmove', (e) => {
            let handledAny = false;
            
            // Handle joystick movement (if active)
            if (joystickTouchId !== null && joystickActive) {
                const touch = Array.from(e.touches).find(t => t.identifier === joystickTouchId);
                if (touch) {
                    e.preventDefault();
                    updateJoystick(touch.clientX, touch.clientY);
                    handledAny = true;
                } else {
                    // Touch lost, reset joystick
                    resetJoystick();
                }
            }
            
            // Handle aim button movement (crosshair control) - joystick mode (relative movement)
            // This works simultaneously with joystick and fire button
            if (aimTouchId !== null && aimButtonActive && game && game.gameState === 'playing') {
                const touch = Array.from(e.touches).find(t => t.identifier === aimTouchId);
                if (touch) {
                    e.preventDefault();
                    // Calculate delta from initial touch position (joystick-like movement)
                    const deltaX = touch.clientX - aimButtonStartX;
                    const deltaY = touch.clientY - aimButtonStartY;
                    
                    // Deadzone: ignore very small movements (5 pixels)
                    const deadZone = 5;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    
                    if (distance > deadZone) {
                        // Normalize direction
                        const normalizedX = deltaX / distance;
                        const normalizedY = deltaY / distance;
                        
                        // Get sensitivity from settings (same as gamepad, default 600, range 100-2000)
                        const sensitivity = (game.settings && game.settings.gamepadSensitivity) || 600;
                        
                        // Calculate movement speed based on distance from center (like joystick)
                        // Max distance is about 100 pixels (button size), normalize to 0-1
                        const maxDistance = 100;
                        const normalizedDistance = Math.min(1, distance / maxDistance);
                        
                        // Apply sensitivity and distance factor
                        // Use a frame-time approximation (16ms = 60fps)
                        const deltaTime = 0.016;
                        const moveSpeed = sensitivity * normalizedDistance;
                        const moveX = normalizedX * moveSpeed * deltaTime;
                        const moveY = normalizedY * moveSpeed * deltaTime;
                        
                        // Update crosshair position relatively
                        const newX = aimButtonStartCrosshairX + moveX;
                        const newY = aimButtonStartCrosshairY + moveY;
                        
                        // Clamp to canvas bounds
                        const clampedX = Math.max(0, Math.min(game.canvas.width, newX));
                        const clampedY = Math.max(0, Math.min(game.canvas.height, newY));
                        
                        // Update crosshair
                        if (game.mouse) {
                            game.mouse.x = clampedX;
                            game.mouse.y = clampedY;
                        }
                        
                        // Trigger mousemove event for compatibility
                        const event = new MouseEvent('mousemove', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: touch.clientX,
                            clientY: touch.clientY
                        });
                        game.canvas.dispatchEvent(event);
                    }
                    handledAny = true;
                }
            }
            
            // Fire button doesn't need movement handling, just keep it active
            // (shooting is handled by continuous mousedown events)
        }, { passive: false });
        
        // Also handle touchcancel on document level
        document.addEventListener('touchcancel', (e) => {
            if (joystickTouchId !== null) {
                const touch = Array.from(e.changedTouches).find(t => t.identifier === joystickTouchId);
                if (touch) {
                    resetJoystick();
                }
            }
            if (aimTouchId !== null) {
                const touch = Array.from(e.changedTouches).find(t => t.identifier === aimTouchId);
                if (touch) {
                    aimButtonActive = false;
                    aimTouchId = null;
                }
            }
        }, { passive: false });
        
        joystickBase.addEventListener('touchend', (e) => {
            e.preventDefault();
            // Don't stop propagation - allow other touches to continue
            if (joystickTouchId !== null) {
                const endedTouch = Array.from(e.changedTouches).find(t => t.identifier === joystickTouchId);
                if (endedTouch) {
                    resetJoystick();
                }
            }
        }, { passive: false });
        
        joystickBase.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            // Don't stop propagation
            resetJoystick();
        }, { passive: false });
        
        // Shoot button touch handlers - allow simultaneous with other controls
        shootButton.addEventListener('touchstart', (e) => {
            initAudioOnFirstTouch(); // Initialize audio on first touch
            e.preventDefault();
            // Don't stop propagation - allow other touches to work simultaneously
            // Always allow new touch, even if shootTouchId is set (safety fallback)
            if (shootTouchId === null || !shootButtonActive) {
                const touch = e.touches[0];
                if (touch) {
                    shootTouchId = touch.identifier;
                    shootButtonActive = true;
                    startShooting();
                }
            } else {
                // If somehow stuck, force reset and allow new touch
                shootTouchId = null;
                shootButtonActive = false;
                stopShooting();
                // Try again with new touch
                const touch = e.touches[0];
                if (touch) {
                    shootTouchId = touch.identifier;
                    shootButtonActive = true;
                    startShooting();
                }
            }
        }, { passive: false });
        
        shootButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            // Don't stop propagation - allow other touches to continue
            // Always reset touch tracking, even if touch not found
            if (shootTouchId !== null) {
                const endedTouch = Array.from(e.changedTouches).find(t => t.identifier === shootTouchId);
                // Always reset, regardless of whether touch was found
                shootButtonActive = false;
                shootTouchId = null;
                stopShooting();
            }
        }, { passive: false });
        
        shootButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            // Don't stop propagation
            shootButtonActive = false;
            shootTouchId = null;
            stopShooting();
        }, { passive: false });
        
        // Aim button touch handlers (controls crosshair) - joystick mode (relative movement)
        aimButton.addEventListener('touchstart', (e) => {
            initAudioOnFirstTouch(); // Initialize audio on first touch
            e.preventDefault();
            // Don't stop propagation - allow other touches to work simultaneously
            if (aimTouchId === null && game.gameState === 'playing') {
                const touch = e.touches[0];
                aimTouchId = touch.identifier;
                aimButtonActive = true;
                
                // Store initial touch position and current crosshair position for relative movement
                aimButtonStartX = touch.clientX;
                aimButtonStartY = touch.clientY;
                if (game.mouse) {
                    aimButtonStartCrosshairX = game.mouse.x;
                    aimButtonStartCrosshairY = game.mouse.y;
                }
                // Crosshair stays where it is - only moves when you drag (joystick mode)
            }
        }, { passive: false });
        
        aimButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            // Don't stop propagation - allow other touches to continue
            // Always reset aim touch tracking, even if touch not found
            if (aimTouchId !== null) {
                const endedTouch = Array.from(e.changedTouches).find(t => t.identifier === aimTouchId);
                // Always reset, regardless of whether touch was found
                aimButtonActive = false;
                aimTouchId = null;
            }
        }, { passive: false });
        
        aimButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            // Don't stop propagation
            aimButtonActive = false;
            aimTouchId = null;
        }, { passive: false });
        
        // Canvas touch for aiming - allow free-form aiming even when buttons are held
        // Check all touches to find ones that are NOT on buttons
        game.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 0) return;
            
            // CRITICAL: Check if any button is currently active FIRST
            // If a button was just touched, don't process canvas touch for that touch
            // This prevents crosshair from jumping to button positions
            const hasActiveButtonTouch = Array.from(e.touches).some(touch => {
                return touch.identifier === joystickTouchId || 
                       touch.identifier === aimTouchId || 
                       touch.identifier === shootTouchId;
            });
            
            // If this touchstart event includes a button touch, don't process it
            // The button handlers will take care of it
            if (hasActiveButtonTouch) {
                return;
            }
            
            const joystickRect = joystickBase.getBoundingClientRect();
            const aimRect = aimButton.getBoundingClientRect();
            const shootRect = shootButton.getBoundingClientRect();
            const pauseRect = pauseButton ? pauseButton.getBoundingClientRect() : { left: 0, right: 0, top: 0, bottom: 0 };
            
            // Check if touching any UI panel
            const uiPanels = ['#ui', '#instructions', '#settingsUI', '#craftingUI', '#shopUI', '#inventoryUI', '#tutorialUI'];
            
            // Find touches that are NOT on buttons (for free-form aiming)
            const freeTouches = Array.from(e.touches).filter(touch => {
                // Double-check: if this touch is tracked by a button, skip it
                if (touch.identifier === joystickTouchId || 
                    touch.identifier === aimTouchId || 
                    touch.identifier === shootTouchId) {
                    return false;
                }
                
                const inJoystick = touch.clientX >= joystickRect.left && touch.clientX <= joystickRect.right &&
                                  touch.clientY >= joystickRect.top && touch.clientY <= joystickRect.bottom;
                const inAim = touch.clientX >= aimRect.left && touch.clientX <= aimRect.right &&
                             touch.clientY >= aimRect.top && touch.clientY <= aimRect.bottom;
                const inShoot = touch.clientX >= shootRect.left && touch.clientX <= shootRect.right &&
                               touch.clientY >= shootRect.top && touch.clientY <= shootRect.bottom;
                const inPause = pauseButton && touch.clientX >= pauseRect.left && touch.clientX <= pauseRect.right &&
                               touch.clientY >= pauseRect.top && touch.clientY <= pauseRect.bottom;
                
                // Check if touching any UI panel
                let inUI = false;
                for (const panelId of uiPanels) {
                    const panel = document.querySelector(panelId);
                    if (panel && (panel.classList.contains('paused') || panel.classList.contains('active'))) {
                        const rect = panel.getBoundingClientRect();
                        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                            inUI = true;
                            break;
                        }
                    }
                }
                
                // Return true if this touch is NOT on any button/UI
                return !inJoystick && !inAim && !inShoot && !inPause && !inUI;
            });
            
            // Allow controls during cutscene phases 0 and 1 (Will's Way Studios and SpaceBell interactive)
            const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                        game.cutsceneId === 'willsWayIntro' && 
                                        (game.cutscenePhase === 0 || game.cutscenePhase === 1);
            
            if (isInteractiveCutscene && freeTouches.length > 0) {
                // During cutscenes, free touches control ship movement
                const touch = freeTouches[0];
                e.preventDefault();
                cutsceneTouchX = touch.clientX;
                cutsceneTouchY = touch.clientY;
                cutsceneTouchActive = true;
                updateAimPosition(touch.clientX, touch.clientY);
            } else if (game.gameState === 'playing' && freeTouches.length > 0) {
                // During gameplay, free touches (not on buttons) control crosshair
                // Touch screen mode: grab crosshair and drag it (relative movement)
                const touch = freeTouches[0];
                initAudioOnFirstTouch(); // Initialize audio on first touch
                e.preventDefault();
                
                // If this is the first touch, store initial position and crosshair position
                if (!touchScreenActive) {
                    touchScreenStartX = touch.clientX;
                    touchScreenStartY = touch.clientY;
                    if (game.mouse) {
                        touchScreenStartCrosshairX = game.mouse.x;
                        touchScreenStartCrosshairY = game.mouse.y;
                    }
                    touchScreenActive = true;
                } else {
                    // Calculate delta from initial touch position (relative movement)
                    const deltaX = touch.clientX - touchScreenStartX;
                    const deltaY = touch.clientY - touchScreenStartY;
                    
                    // Deadzone: ignore very small movements (5 pixels)
                    const deadZone = 5;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    
                    if (distance > deadZone) {
                        // Normalize direction
                        const normalizedX = deltaX / distance;
                        const normalizedY = deltaY / distance;
                        
                        // Get sensitivity from settings (same as gamepad and aim button)
                        const sensitivity = (game.settings && game.settings.gamepadSensitivity) || 600;
                        
                        // Calculate movement speed based on distance
                        // Max distance is about 200 pixels, normalize to 0-1
                        const maxDistance = 200;
                        const normalizedDistance = Math.min(1, distance / maxDistance);
                        
                        // Apply sensitivity and distance factor
                        const deltaTime = 0.016; // 60fps approximation
                        const moveSpeed = sensitivity * normalizedDistance;
                        const moveX = normalizedX * moveSpeed * deltaTime;
                        const moveY = normalizedY * moveSpeed * deltaTime;
                        
                        // Update crosshair position relatively
                        const newX = touchScreenStartCrosshairX + moveX;
                        const newY = touchScreenStartCrosshairY + moveY;
                        
                        // Clamp to canvas bounds
                        const clampedX = Math.max(0, Math.min(game.canvas.width, newX));
                        const clampedY = Math.max(0, Math.min(game.canvas.height, newY));
                        
                        // Update crosshair
                        if (game.mouse) {
                            game.mouse.x = clampedX;
                            game.mouse.y = clampedY;
                        }
                        
                        // Trigger mousemove event for compatibility
                        const event = new MouseEvent('mousemove', {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            clientX: touch.clientX,
                            clientY: touch.clientY
                        });
                        game.canvas.dispatchEvent(event);
                    }
                }
            }
        }, { passive: false });
        
        game.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 0) return;
            
            // CRITICAL: If aim button is active, DON'T process canvas touchmove
            // The document touchmove handler will handle aim button dragging
            // This ensures aim button controls crosshair properly
            if (aimButtonActive && aimTouchId !== null) {
                // Aim button is controlling crosshair - let document handler do it
                return;
            }
            
            const joystickRect = joystickBase.getBoundingClientRect();
            const aimRect = aimButton.getBoundingClientRect();
            const shootRect = shootButton.getBoundingClientRect();
            const pauseRect = pauseButton ? pauseButton.getBoundingClientRect() : { left: 0, right: 0, top: 0, bottom: 0 };
            
            // Check if touching any UI panel
            const uiPanels = ['#ui', '#instructions', '#settingsUI', '#craftingUI', '#shopUI', '#inventoryUI', '#tutorialUI'];
            
            // Find touches that are NOT on buttons (for free-form aiming)
            const freeTouches = Array.from(e.touches).filter(touch => {
                // Check if this touch is one of our tracked button touches
                const isJoystickTouch = touch.identifier === joystickTouchId;
                const isAimTouch = touch.identifier === aimTouchId;
                const isShootTouch = touch.identifier === shootTouchId;
                
                // If it's a tracked button touch, don't use it for free-form aiming
                if (isJoystickTouch || isAimTouch || isShootTouch) {
                    return false;
                }
                
                // Check if touch is physically on a button
                const inJoystick = touch.clientX >= joystickRect.left && touch.clientX <= joystickRect.right &&
                                  touch.clientY >= joystickRect.top && touch.clientY <= joystickRect.bottom;
                const inAim = touch.clientX >= aimRect.left && touch.clientX <= aimRect.right &&
                             touch.clientY >= aimRect.top && touch.clientY <= aimRect.bottom;
                const inShoot = touch.clientX >= shootRect.left && touch.clientX <= shootRect.right &&
                               touch.clientY >= shootRect.top && touch.clientY <= shootRect.bottom;
                const inPause = pauseButton && touch.clientX >= pauseRect.left && touch.clientX <= pauseRect.right &&
                               touch.clientY >= pauseRect.top && touch.clientY <= pauseRect.bottom;
                
                // Check if touching any UI panel
                let inUI = false;
                for (const panelId of uiPanels) {
                    const panel = document.querySelector(panelId);
                    if (panel && (panel.classList.contains('paused') || panel.classList.contains('active'))) {
                        const rect = panel.getBoundingClientRect();
                        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                            inUI = true;
                            break;
                        }
                    }
                }
                
                // Return true if this touch is NOT on any button/UI
                return !inJoystick && !inAim && !inShoot && !inPause && !inUI;
            });
            
            // Allow controls during cutscene phases 0 and 1
            const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                        game.cutsceneId === 'willsWayIntro' && 
                                        (game.cutscenePhase === 0 || game.cutscenePhase === 1);
            
            if (isInteractiveCutscene && freeTouches.length > 0) {
                // During cutscenes, free touches control ship movement
                const touch = freeTouches[0];
                e.preventDefault();
                cutsceneTouchX = touch.clientX;
                cutsceneTouchY = touch.clientY;
                cutsceneTouchActive = true;
                updateAimPosition(touch.clientX, touch.clientY);
            } else if (game.gameState === 'playing' && freeTouches.length > 0 && touchScreenActive) {
                // During gameplay, continue relative movement for touch screen mode
                const touch = freeTouches[0];
                e.preventDefault();
                
                // Calculate delta from initial touch position (relative movement)
                const deltaX = touch.clientX - touchScreenStartX;
                const deltaY = touch.clientY - touchScreenStartY;
                
                // Deadzone: ignore very small movements (5 pixels)
                const deadZone = 5;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (distance > deadZone) {
                    // Normalize direction
                    const normalizedX = deltaX / distance;
                    const normalizedY = deltaY / distance;
                    
                    // Get sensitivity from settings (same as gamepad and aim button)
                    const sensitivity = (game.settings && game.settings.gamepadSensitivity) || 600;
                    
                    // Calculate movement speed based on distance
                    const maxDistance = 200;
                    const normalizedDistance = Math.min(1, distance / maxDistance);
                    
                    // Apply sensitivity and distance factor
                    const deltaTime = 0.016; // 60fps approximation
                    const moveSpeed = sensitivity * normalizedDistance;
                    const moveX = normalizedX * moveSpeed * deltaTime;
                    const moveY = normalizedY * moveSpeed * deltaTime;
                    
                    // Update crosshair position relatively
                    const newX = touchScreenStartCrosshairX + moveX;
                    const newY = touchScreenStartCrosshairY + moveY;
                    
                    // Clamp to canvas bounds
                    const clampedX = Math.max(0, Math.min(game.canvas.width, newX));
                    const clampedY = Math.max(0, Math.min(game.canvas.height, newY));
                    
                    // Update crosshair
                    if (game.mouse) {
                        game.mouse.x = clampedX;
                        game.mouse.y = clampedY;
                    }
                    
                    // Trigger mousemove event for compatibility
                    const event = new MouseEvent('mousemove', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    });
                    game.canvas.dispatchEvent(event);
                }
            }
        }, { passive: false });
        
        // Handle touch end for cutscene movement
        game.canvas.addEventListener('touchend', (e) => {
            const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                        game.cutsceneId === 'willsWayIntro' && 
                                        (game.cutscenePhase === 0 || game.cutscenePhase === 1);
            
            if (isInteractiveCutscene) {
                // Stop ship movement when touch ends
                cutsceneTouchActive = false;
                cutsceneTouchX = null;
                cutsceneTouchY = null;
            } else if (game.gameState === 'playing') {
                // Reset touch screen mode when touch ends
                touchScreenActive = false;
                touchScreenStartX = 0;
                touchScreenStartY = 0;
                touchScreenStartCrosshairX = 0;
                touchScreenStartCrosshairY = 0;
            }
        }, { passive: false });
        
        game.canvas.addEventListener('touchcancel', (e) => {
            const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                        game.cutsceneId === 'willsWayIntro' && 
                                        (game.cutscenePhase === 0 || game.cutscenePhase === 1);
            
            if (isInteractiveCutscene) {
                // Stop ship movement when touch is cancelled
                cutsceneTouchActive = false;
                cutsceneTouchX = null;
                cutsceneTouchY = null;
            } else if (game.gameState === 'playing') {
                // Reset touch screen mode when touch is cancelled
                touchScreenActive = false;
                touchScreenStartX = 0;
                touchScreenStartY = 0;
                touchScreenStartCrosshairX = 0;
                touchScreenStartCrosshairY = 0;
            }
        }, { passive: false });
        
        // Add touch handlers to cutscene overlay/canvas for cutscene phases 0 & 1
        // This is critical because cutscenes use cutsceneOverlay, not game.canvas
        function setupCutsceneTouchHandlers() {
            const cutsceneOverlay = document.getElementById('cutsceneOverlay');
            const cutsceneCanvas = document.getElementById('cutsceneCanvas');
            
            if (!cutsceneOverlay) return;
            
            // Touch handlers for cutscene overlay
            cutsceneOverlay.addEventListener('touchstart', (e) => {
                if (!game) return;
                
                const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                            game.cutsceneId === 'willsWayIntro' && 
                                            (game.cutscenePhase === 0 || game.cutscenePhase === 1);
                
                if (isInteractiveCutscene) {
                    const touch = e.touches[0];
                    if (touch) {
                        e.preventDefault();
                        e.stopPropagation();
                        cutsceneTouchX = touch.clientX;
                        cutsceneTouchY = touch.clientY;
                        cutsceneTouchActive = true;
                        updateAimPosition(touch.clientX, touch.clientY);
                    }
                }
            }, { passive: false });
            
            cutsceneOverlay.addEventListener('touchmove', (e) => {
                if (!game) return;
                
                const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                            game.cutsceneId === 'willsWayIntro' && 
                                            (game.cutscenePhase === 0 || game.cutscenePhase === 1);
                
                if (isInteractiveCutscene) {
                    const touch = e.touches[0];
                    if (touch) {
                        e.preventDefault();
                        e.stopPropagation();
                        cutsceneTouchX = touch.clientX;
                        cutsceneTouchY = touch.clientY;
                        cutsceneTouchActive = true;
                        updateAimPosition(touch.clientX, touch.clientY);
                    }
                }
            }, { passive: false });
            
            cutsceneOverlay.addEventListener('touchend', (e) => {
                if (!game) return;
                
                const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                            game.cutsceneId === 'willsWayIntro' && 
                                            (game.cutscenePhase === 0 || game.cutscenePhase === 1);
                
                if (isInteractiveCutscene) {
                    e.preventDefault();
                    e.stopPropagation();
                    cutsceneTouchActive = false;
                    cutsceneTouchX = null;
                    cutsceneTouchY = null;
                }
            }, { passive: false });
            
            cutsceneOverlay.addEventListener('touchcancel', (e) => {
                if (!game) return;
                
                const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                            game.cutsceneId === 'willsWayIntro' && 
                                            (game.cutscenePhase === 0 || game.cutscenePhase === 1);
                
                if (isInteractiveCutscene) {
                    e.preventDefault();
                    cutsceneTouchActive = false;
                    cutsceneTouchX = null;
                    cutsceneTouchY = null;
                }
            }, { passive: false });
            
            // Also add handlers to cutsceneCanvas if it exists
            if (cutsceneCanvas) {
                cutsceneCanvas.addEventListener('touchstart', (e) => {
                    if (!game) return;
                    
                    const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                                game.cutsceneId === 'willsWayIntro' && 
                                                (game.cutscenePhase === 0 || game.cutscenePhase === 1);
                    
                    if (isInteractiveCutscene) {
                        const touch = e.touches[0];
                        if (touch) {
                            e.preventDefault();
                            e.stopPropagation();
                            cutsceneTouchX = touch.clientX;
                            cutsceneTouchY = touch.clientY;
                            cutsceneTouchActive = true;
                            updateAimPosition(touch.clientX, touch.clientY);
                        }
                    }
                }, { passive: false });
                
                cutsceneCanvas.addEventListener('touchmove', (e) => {
                    if (!game) return;
                    
                    const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                                game.cutsceneId === 'willsWayIntro' && 
                                                (game.cutscenePhase === 0 || game.cutscenePhase === 1);
                    
                    if (isInteractiveCutscene) {
                        const touch = e.touches[0];
                        if (touch) {
                            e.preventDefault();
                            e.stopPropagation();
                            cutsceneTouchX = touch.clientX;
                            cutsceneTouchY = touch.clientY;
                            cutsceneTouchActive = true;
                            updateAimPosition(touch.clientX, touch.clientY);
                        }
                    }
                }, { passive: false });
                
                cutsceneCanvas.addEventListener('touchend', (e) => {
                    if (!game) return;
                    
                    const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                                game.cutsceneId === 'willsWayIntro' && 
                                                (game.cutscenePhase === 0 || game.cutscenePhase === 1);
                    
                    if (isInteractiveCutscene) {
                        e.preventDefault();
                        e.stopPropagation();
                        cutsceneTouchActive = false;
                        cutsceneTouchX = null;
                        cutsceneTouchY = null;
                    }
                }, { passive: false });
                
                cutsceneCanvas.addEventListener('touchcancel', (e) => {
                    if (!game) return;
                    
                    const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                                game.cutsceneId === 'willsWayIntro' && 
                                                (game.cutscenePhase === 0 || game.cutscenePhase === 1);
                    
                    if (isInteractiveCutscene) {
                        e.preventDefault();
                        cutsceneTouchActive = false;
                        cutsceneTouchX = null;
                        cutsceneTouchY = null;
                    }
                }, { passive: false });
            }
        }
        
        // Setup cutscene touch handlers (wait for DOM to be ready)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(setupCutsceneTouchHandlers, 500); // Wait a bit for cutscene elements
            });
        } else {
            setTimeout(setupCutsceneTouchHandlers, 500); // Wait a bit for cutscene elements
        }
        
        // Smooth joystick input using requestAnimationFrame
        let animationFrameId = null;
        let isUpdateLoopRunning = false;
        
        function updateJoystickInput() {
            if (!game) {
                isUpdateLoopRunning = false;
                return;
            }
            
            // Always keep the loop running to handle cutscene phases
            const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                        game.cutsceneId === 'willsWayIntro' && 
                                        (game.cutscenePhase === 0 || game.cutscenePhase === 1);
            
            // Disable joystick during cutscenes - use touch movement instead
            if (joystickActive && game.gameState === 'playing' && !isInteractiveCutscene) {
                const now = performance.now();
                if (now - lastJoystickUpdate >= JOYSTICK_UPDATE_INTERVAL) {
                    const deadZone = 0.15;
                    const x = joystickX / joystickMaxDistance;
                    const y = joystickY / joystickMaxDistance;
                    
                    // Update movement keys based on joystick
                    if (Math.abs(x) > deadZone) {
                        if (x > 0) {
                            game.keys['ArrowRight'] = true;
                            game.keys['KeyD'] = true;
                            game.keys['ArrowLeft'] = false;
                            game.keys['KeyA'] = false;
                        } else {
                            game.keys['ArrowLeft'] = true;
                            game.keys['KeyA'] = true;
                            game.keys['ArrowRight'] = false;
                            game.keys['KeyD'] = false;
                        }
                    } else {
                        game.keys['ArrowLeft'] = false;
                        game.keys['KeyA'] = false;
                        game.keys['ArrowRight'] = false;
                        game.keys['KeyD'] = false;
                    }
                    
                    if (Math.abs(y) > deadZone) {
                        if (y > 0) {
                            game.keys['ArrowDown'] = true;
                            game.keys['KeyS'] = true;
                            game.keys['ArrowUp'] = false;
                            game.keys['KeyW'] = false;
                        } else {
                            game.keys['ArrowUp'] = true;
                            game.keys['KeyW'] = true;
                            game.keys['ArrowDown'] = false;
                            game.keys['KeyS'] = false;
                        }
                    } else {
                        game.keys['ArrowUp'] = false;
                        game.keys['KeyW'] = false;
                        game.keys['ArrowDown'] = false;
                        game.keys['KeyS'] = false;
                    }
                    
                    lastJoystickUpdate = now;
                }
            } else if (!joystickActive) {
                // Clear keys when joystick is not active
                if (game.keys) {
                    game.keys['ArrowLeft'] = false;
                    game.keys['KeyA'] = false;
                    game.keys['ArrowRight'] = false;
                    game.keys['KeyD'] = false;
                    game.keys['ArrowUp'] = false;
                    game.keys['KeyW'] = false;
                    game.keys['ArrowDown'] = false;
                    game.keys['KeyS'] = false;
                }
            }
            
            // Handle cutscene touch movement (ship follows touch smoothly)
            if (isInteractiveCutscene && game.player) {
                // Smoothly move ship toward touch position
                updateCutsceneShipMovement();
            }
            
            // Keep loop running continuously
            isUpdateLoopRunning = true;
            animationFrameId = requestAnimationFrame(updateJoystickInput);
        }
        
        // Cutscene touch movement variables
        let cutsceneTouchX = null;
        let cutsceneTouchY = null;
        let cutsceneTouchActive = false;
        let lastCutsceneUpdateTime = performance.now();
        const SHIP_MOVE_SPEED = 300; // pixels per second
        
        function updateCutsceneShipMovement() {
            if (!game || !game.player || !cutsceneTouchActive || cutsceneTouchX === null || cutsceneTouchY === null) {
                return;
            }
            
            // Calculate deltaTime
            const now = performance.now();
            const deltaTime = Math.min((now - lastCutsceneUpdateTime) / 1000, 0.1); // Cap at 100ms
            lastCutsceneUpdateTime = now;
            
            // Get canvas coordinates from touch position
            const rect = game.canvas.getBoundingClientRect();
            const targetX = Math.max(0, Math.min(game.canvas.width, cutsceneTouchX - rect.left));
            const targetY = Math.max(0, Math.min(game.canvas.height, cutsceneTouchY - rect.top));
            
            // Calculate distance to target
            const dx = targetX - game.player.x;
            const dy = targetY - game.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Move ship smoothly toward touch position
            if (distance > 2) { // Only move if more than 2 pixels away
                const moveSpeed = SHIP_MOVE_SPEED * deltaTime;
                const moveX = (dx / distance) * moveSpeed;
                const moveY = (dy / distance) * moveSpeed;
                
                // Don't overshoot target
                if (Math.abs(moveX) > Math.abs(dx)) {
                    game.player.x = targetX;
                } else {
                    game.player.x += moveX;
                }
                
                if (Math.abs(moveY) > Math.abs(dy)) {
                    game.player.y = targetY;
                } else {
                    game.player.y += moveY;
                }
            } else {
                // Snap to target if very close
                game.player.x = targetX;
                game.player.y = targetY;
            }
            
            // Update mouse position for shooting direction
            if (game.mouse) {
                game.mouse.x = targetX;
                game.mouse.y = targetY;
            }
        }
        
        // Start the update loop
        if (!isUpdateLoopRunning) {
            updateJoystickInput();
        }
        
        // Setup double-tap for cutscenes
        setupCutsceneDoubleTap();
    }
    
    function addCloseButtonsToPanels() {
        const panels = [
            { id: 'instructions', closeFn: 'closeInstructions', toggleFn: 'toggleInstructions' },
            { id: 'settingsUI', closeFn: 'closeSettings' },
            { id: 'craftingUI', closeFn: 'closeCrafting' },
            { id: 'shopUI', closeFn: 'closeShop' },
            { id: 'inventoryUI', closeFn: 'closeInventory' },
            { id: 'tutorialUI', closeFn: 'closeTutorial' },
            { id: 'theoryPanel', closeFn: null, toggleFn: 'togglePause' }, // Theory panel closes with pause
            { id: 'materialsInventory', closeFn: null, toggleFn: 'togglePause' } // Materials closes with pause
        ];
        
        panels.forEach(panel => {
            const element = document.getElementById(panel.id);
            if (element) {
                // Check if close button already exists
                let closeBtn = element.querySelector('.mobile-close-btn');
                if (!closeBtn) {
                    closeBtn = document.createElement('button');
                    closeBtn.className = 'mobile-close-btn';
                    closeBtn.innerHTML = '×';
                    closeBtn.style.display = 'none';
                    closeBtn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (panel.closeFn && game && typeof game[panel.closeFn] === 'function') {
                            game[panel.closeFn]();
                        } else if (panel.toggleFn && game && typeof game[panel.toggleFn] === 'function') {
                            game[panel.toggleFn]();
                        } else if (panel.id === 'instructions' && game && typeof game.toggleInstructions === 'function') {
                            game.toggleInstructions();
                        } else {
                            // Fallback: hide the panel
                            element.classList.remove('paused', 'active');
                            // If it's theory or materials, also unpause
                            if ((panel.id === 'theoryPanel' || panel.id === 'materialsInventory') && game && typeof game.togglePause === 'function') {
                                game.togglePause();
                            }
                        }
                    };
                    element.style.position = 'relative';
                    element.appendChild(closeBtn);
                } else {
                    // Update existing button onclick
                    closeBtn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (panel.closeFn && game && typeof game[panel.closeFn] === 'function') {
                            game[panel.closeFn]();
                        } else if (panel.toggleFn && game && typeof game[panel.toggleFn] === 'function') {
                            game[panel.toggleFn]();
                        } else if (panel.id === 'instructions' && game && typeof game.toggleInstructions === 'function') {
                            game.toggleInstructions();
                        } else {
                            element.classList.remove('paused', 'active');
                            if ((panel.id === 'theoryPanel' || panel.id === 'materialsInventory') && game && typeof game.togglePause === 'function') {
                                game.togglePause();
                            }
                        }
                    };
                }
                
                // Show close button when panel is visible
                const observer = new MutationObserver(() => {
                    const isVisible = element.classList.contains('paused') || element.classList.contains('active') || 
                                     (element.style.display !== 'none' && window.getComputedStyle(element).display !== 'none');
                    if (closeBtn) {
                        closeBtn.style.display = isVisible ? 'flex' : 'none';
                    }
                });
                observer.observe(element, { attributes: true, attributeFilter: ['class', 'style'] });
                
                // Also check display style
                const checkDisplay = setInterval(() => {
                    const isVisible = element.classList.contains('paused') || element.classList.contains('active') || 
                                     (element.style.display !== 'none' && window.getComputedStyle(element).display !== 'none');
                    if (closeBtn) {
                        closeBtn.style.display = isVisible ? 'flex' : 'none';
                    }
                }, 500);
                
                // Initial check
                const isVisible = element.classList.contains('paused') || element.classList.contains('active') || 
                                 (element.style.display !== 'none' && window.getComputedStyle(element).display !== 'none');
                if (closeBtn) {
                    closeBtn.style.display = isVisible ? 'flex' : 'none';
                }
            }
        });
    }
    
    function enableTouchScrolling() {
        const scrollablePanels = ['#ui', '#instructions', '#settingsUI', '#craftingUI', '#shopUI', '#inventoryUI', '#tutorialUI', '#theoryPanel'];
        
        scrollablePanels.forEach(panelId => {
            const panel = document.querySelector(panelId);
            if (panel) {
                // Ensure touch scrolling is enabled
                panel.style.overflowY = 'auto';
                panel.style.webkitOverflowScrolling = 'touch';
                panel.style.touchAction = 'pan-y';
                
                // Prevent default touch behavior only when not scrolling
                let isScrolling = false;
                let scrollStartY = 0;
                
                panel.addEventListener('touchstart', (e) => {
                    scrollStartY = e.touches[0].clientY;
                }, { passive: true });
                
                panel.addEventListener('touchmove', (e) => {
                    const touchY = e.touches[0].clientY;
                    const scrollTop = panel.scrollTop;
                    const scrollHeight = panel.scrollHeight;
                    const clientHeight = panel.clientHeight;
                    const isAtTop = scrollTop === 0;
                    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
                    const scrollingUp = touchY < scrollStartY;
                    const scrollingDown = touchY > scrollStartY;
                    
                    // Allow scrolling if we're not at boundaries or scrolling in allowed direction
                    if ((!isAtTop && scrollingUp) || (!isAtBottom && scrollingDown) || (scrollTop > 0 && scrollTop < scrollHeight - clientHeight)) {
                        isScrolling = true;
                        // Allow default scrolling behavior
                        return;
                    }
                }, { passive: true });
            }
        });
    }
    
    function updateJoystick(clientX, clientY) {
        const dx = clientX - joystickCenterX;
        const dy = clientY - joystickCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > joystickMaxDistance) {
            const angle = Math.atan2(dy, dx);
            joystickX = Math.cos(angle) * joystickMaxDistance;
            joystickY = Math.sin(angle) * joystickMaxDistance;
        } else {
            joystickX = dx;
            joystickY = dy;
        }
        
        // Update visual position smoothly
        const handle = document.getElementById('joystickHandle');
        if (handle) {
            handle.style.transform = `translate(calc(-50% + ${joystickX}px), calc(-50% + ${joystickY}px))`;
        }
    }
    
    function resetJoystick() {
        joystickActive = false;
        joystickTouchId = null;
        joystickX = 0;
        joystickY = 0;
        
        const handle = document.getElementById('joystickHandle');
        if (handle) {
            handle.style.transform = 'translate(-50%, -50%)';
            handle.style.transition = 'transform 0.15s ease-out';
            setTimeout(() => {
                if (handle) {
                    handle.style.transition = 'transform 0.05s linear';
                }
            }, 150);
        }
        
        // Clear movement keys immediately and forcefully
        if (game && game.keys) {
            game.keys['ArrowLeft'] = false;
            game.keys['KeyA'] = false;
            game.keys['ArrowRight'] = false;
            game.keys['KeyD'] = false;
            game.keys['ArrowUp'] = false;
            game.keys['KeyW'] = false;
            game.keys['ArrowDown'] = false;
            game.keys['KeyS'] = false;
            
            // Also trigger keyup events to ensure game recognizes the keys are released
            const keysToClear = ['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'ArrowUp', 'KeyW', 'ArrowDown', 'KeyS'];
            keysToClear.forEach(key => {
                if (game.keys[key]) {
                    const event = new KeyboardEvent('keyup', {
                        code: key,
                        key: key,
                        bubbles: true,
                        cancelable: true
                    });
                    document.dispatchEvent(event);
                }
            });
        }
    }
    
    // Shooting state management
    let shootingInterval = null;
    
    function startShooting() {
        // Allow shooting during playing state or interactive cutscene phases
        // Phase 0 = Will's-Way-Studios logo page (ship can shoot)
        // Phase 1 = SpaceBell interactive logo page (ship can shoot)
        const isInteractiveCutscene = game && game.gameState === 'cutscene' && 
                                     game.cutsceneId === 'willsWayIntro' && 
                                     (game.cutscenePhase === 0 || game.cutscenePhase === 1);
        
        if (game && (game.gameState === 'playing' || isInteractiveCutscene)) {
            // Set mouseDown state
            game.mouseDown = true;
            
            // Dispatch mousedown event to correct target
            if (isInteractiveCutscene) {
                // During cutscenes, dispatch to document (where game listens) and cutscene elements
                // The game listens on document but checks e.target for cutsceneCanvas/cutsceneOverlay
                const event = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: game.mouse ? game.mouse.x : 0,
                    clientY: game.mouse ? game.mouse.y : 0
                });
                // Dispatch to document first (where the game's listener is)
                document.dispatchEvent(event);
                // Also dispatch to cutscene elements to ensure target is correct
                if (game.cutsceneCanvas) {
                    game.cutsceneCanvas.dispatchEvent(event);
                }
                if (game.cutsceneOverlay) {
                    game.cutsceneOverlay.dispatchEvent(event);
                }
            } else {
                // During gameplay, dispatch to game.canvas
                if (game.canvas) {
                    const event = new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: game.mouse ? game.mouse.x : 0,
                        clientY: game.mouse ? game.mouse.y : 0
                    });
                    game.canvas.dispatchEvent(event);
                }
            }
            
            // Keep shooting active by maintaining mouseDown state
            // For gameplay, use interval for continuous shooting
            // For cutscenes, also dispatch periodic events for continuous shooting
            if (!shootingInterval) {
                shootingInterval = setInterval(() => {
                    if (game && shootButtonActive && game.mouseDown) {
                        // Keep mouseDown true while button is held
                        game.mouseDown = true;
                        
                        // For cutscenes, dispatch periodic mousedown events for continuous shooting
                        if (isInteractiveCutscene) {
                            const event = new MouseEvent('mousedown', {
                                bubbles: true,
                                cancelable: true,
                                view: window,
                                clientX: game.mouse ? game.mouse.x : 0,
                                clientY: game.mouse ? game.mouse.y : 0
                            });
                            document.dispatchEvent(event);
                            if (game.cutsceneCanvas) {
                                game.cutsceneCanvas.dispatchEvent(event);
                            }
                        }
                    } else {
                        // If button not active, clear interval
                        if (shootingInterval) {
                            clearInterval(shootingInterval);
                            shootingInterval = null;
                        }
                    }
                }, 50); // Check every 50ms
            }
        }
    }
    
    function stopShooting() {
        // Clear the shooting interval immediately
        if (shootingInterval) {
            clearInterval(shootingInterval);
            shootingInterval = null;
        }
        
        if (game) {
            game.mouseDown = false;
            
            // Check if we're in interactive cutscene
            const isInteractiveCutscene = game.gameState === 'cutscene' && 
                                         game.cutsceneId === 'willsWayIntro' && 
                                         (game.cutscenePhase === 0 || game.cutscenePhase === 1);
            
            // Trigger mouseup event to correct target
            if (isInteractiveCutscene) {
                // During cutscenes, dispatch to document and cutscene elements
                const event = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: game.mouse ? game.mouse.x : 0,
                    clientY: game.mouse ? game.mouse.y : 0
                });
                document.dispatchEvent(event);
                if (game.cutsceneCanvas) {
                    game.cutsceneCanvas.dispatchEvent(event);
                }
                if (game.cutsceneOverlay) {
                    game.cutsceneOverlay.dispatchEvent(event);
                }
            } else {
                // During gameplay, dispatch to game.canvas
                if (game.canvas) {
                    const event = new MouseEvent('mouseup', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: game.mouse ? game.mouse.x : 0,
                        clientY: game.mouse ? game.mouse.y : 0
                    });
                    game.canvas.dispatchEvent(event);
                }
            }
        }
    }
    
    function updateAimPosition(clientX, clientY) {
        if (!game || !game.canvas) return;
        
        const rect = game.canvas.getBoundingClientRect();
        // Direct positioning for touch controls (1:1 mapping)
        // Touch controls use direct positioning, not relative movement like gamepad
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // Clamp to canvas bounds
        const clampedX = Math.max(0, Math.min(game.canvas.width, x));
        const clampedY = Math.max(0, Math.min(game.canvas.height, y));
        
        // Update mouse position for aiming
        if (game.mouse) {
            game.mouse.x = clampedX;
            game.mouse.y = clampedY;
        }
        
        // Trigger mousemove event for compatibility
        const event = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: clientX,
            clientY: clientY
        });
        game.canvas.dispatchEvent(event);
    }
    
    // Double-tap detection for skipping cutscenes
    let lastCutsceneTap = { time: 0, x: 0, y: 0 };
    const DOUBLE_TAP_DELAY = 300; // milliseconds
    const DOUBLE_TAP_DISTANCE = 50; // pixels
    
    // Add double-tap handler for cutscene overlay
    function setupCutsceneDoubleTap() {
        // Wait a bit for cutscene overlay to be available
        setTimeout(() => {
            const cutsceneOverlay = document.getElementById('cutsceneOverlay');
            if (cutsceneOverlay) {
                cutsceneOverlay.addEventListener('touchend', (e) => {
                    if (game && game.gameState === 'cutscene') {
                        const touch = e.changedTouches[0];
                        if (touch) {
                            // Check if tap is on the overlay (not on skip button or text)
                            const target = document.elementFromPoint(touch.clientX, touch.clientY);
                            if (target && 
                                !target.closest('#cutsceneSkip') && 
                                !target.closest('.cutscene-text') &&
                                target.closest('#cutsceneOverlay')) {
                                
                                const currentTime = Date.now();
                                const timeDiff = currentTime - lastCutsceneTap.time;
                                const xDiff = Math.abs(touch.clientX - lastCutsceneTap.x);
                                const yDiff = Math.abs(touch.clientY - lastCutsceneTap.y);
                                
                                // Check if this is a double tap (within 300ms and 50px distance)
                                if (timeDiff < DOUBLE_TAP_DELAY && xDiff < DOUBLE_TAP_DISTANCE && yDiff < DOUBLE_TAP_DISTANCE && lastCutsceneTap.time > 0) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (game && typeof game.skipCutscene === 'function') {
                                        game.skipCutscene();
                                    }
                                    lastCutsceneTap = { time: 0, x: 0, y: 0 };
                                } else {
                                    // Store this tap
                                    lastCutsceneTap = { time: currentTime, x: touch.clientX, y: touch.clientY };
                                }
                            }
                        }
                    }
                }, { passive: false });
            }
        }, 1000);
        
        // Also handle double tap on canvas during cutscenes
        if (game && game.canvas) {
            game.canvas.addEventListener('touchend', (e) => {
                if (game && game.gameState === 'cutscene') {
                    const touch = e.changedTouches[0];
                    if (touch) {
                        const target = document.elementFromPoint(touch.clientX, touch.clientY);
                        if (target && target.closest('#cutsceneOverlay')) {
                            const currentTime = Date.now();
                            const timeDiff = currentTime - lastCutsceneTap.time;
                            const xDiff = Math.abs(touch.clientX - lastCutsceneTap.x);
                            const yDiff = Math.abs(touch.clientY - lastCutsceneTap.y);
                            
                            // Check if this is a double tap
                            if (timeDiff < DOUBLE_TAP_DELAY && xDiff < DOUBLE_TAP_DISTANCE && yDiff < DOUBLE_TAP_DISTANCE && lastCutsceneTap.time > 0) {
                                e.preventDefault();
                                e.stopPropagation();
                                if (game && typeof game.skipCutscene === 'function') {
                                    game.skipCutscene();
                                }
                                lastCutsceneTap = { time: 0, x: 0, y: 0 };
                            } else {
                                lastCutsceneTap = { time: currentTime, x: touch.clientX, y: touch.clientY };
                            }
                        }
                    }
                }
            }, { passive: false });
        }
    }
    
    // Prevent default touch behaviors only for game canvas
    document.addEventListener('touchstart', (e) => {
        const target = e.target;
        
        // Allow default for UI elements, inputs, buttons, and scrollable panels
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON' || 
            target.closest('#ui') || target.closest('#instructions') || target.closest('.cutscene-text') ||
            target.closest('#settingsUI') || target.closest('#craftingUI') || target.closest('#shopUI') ||
            target.closest('#inventoryUI') || target.closest('#tutorialUI') || target.closest('.mobile-close-btn')) {
            return;
        }
        
        // Prevent default for canvas touches only
        if (target === game?.canvas || (target.closest('#gameContainer') && !target.closest('#ui, #instructions, #settingsUI, #craftingUI, #shopUI, #inventoryUI, #tutorialUI'))) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        const target = e.target;
        
        // Allow scrolling for UI panels
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || 
            target.closest('#ui') || target.closest('#instructions') || 
            target.closest('#settingsUI') || target.closest('#craftingUI') || 
            target.closest('#shopUI') || target.closest('#inventoryUI') || 
            target.closest('#tutorialUI')) {
            return;
        }
        
        // Prevent default for canvas touches only
        if (target === game?.canvas || (target.closest('#gameContainer') && !target.closest('#ui, #instructions, #settingsUI, #craftingUI, #shopUI, #inventoryUI, #tutorialUI'))) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileControls);
    } else {
        initMobileControls();
    }
    
    // Also try to initialize after a short delay to ensure game.js has loaded
    setTimeout(initMobileControls, 500);
    
})();
