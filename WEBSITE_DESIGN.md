# Website Design Documentation

## Overview

The SpaceBell website is built with Next.js 15, using static export for Netlify deployment. It features an interactive, game-integrated design with a custom ship cursor and shooting mechanics.

**Location**: `C:\SpaceBell.games\website`

---

## Technology Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React** - UI components
- **Canvas API** - Custom cursor and animations

---

## Architecture

### Project Structure

```
website/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   ├── globals.css          # Global styles
│   ├── components/
│   │   ├── ShipCursor.tsx   # Custom ship cursor
│   │   └── LayoutWrapper.tsx # Global layout wrapper
│   ├── bell/
│   │   └── page.tsx         # Bell Mode page
│   ├── ensemble/
│   │   └── page.tsx         # Ensemble Mode page
│   ├── individual/
│   │   └── page.tsx         # Individual Mode page
│   ├── demo/
│   │   └── page.tsx         # Demo download page
│   ├── updates/
│   │   └── page.tsx         # Updates/news page
│   ├── early-access/
│   │   └── page.tsx         # Early access page
│   └── about/
│       └── page.tsx         # About page
├── public/
│   ├── downloads/
│   │   └── SpaceBell-Demo-Setup.exe
│   └── images/
│       ├── bell-mode-icon.svg
│       ├── ensemble-mode-icon.svg
│       ├── individual-mode-icon.svg
│       ├── play-demo-icon.svg
│       ├── updates-icon.svg
│       ├── early-access-icon.svg
│       └── about-icon.svg
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies
└── out/                     # Build output (for Netlify)
```

---

## Key Features

### 1. Custom Ship Cursor

**Component**: `app/components/ShipCursor.tsx`

- Replaces default mouse cursor with game ship
- Ship follows mouse movement
- Ship rotates to face movement direction
- Mode-specific colors (Bell, Ensemble, Individual, Default)
- Canvas-based rendering for smooth animation

**Features**:
- No default cursor visible anywhere
- Ship always visible at cursor position
- Smooth rotation based on movement
- Color changes based on current page/mode

### 2. Shooting Mechanics

**How it works**:
- Click anywhere to shoot bullets
- Bullets travel from ship to click position
- Bullets trigger clicks when hitting interactive elements
- Smooth trajectory animation
- Visual bullet trails

**Rate Limiting**:
- Maximum 1 bullet every 1.5 seconds
- Prevents rapid clicking and continuous shooting
- Cooldown enforced at click handler level

**Navigation Link Handling**:
- Bullets that hit navigation links (`<a>` tags) are immediately removed
- Prevents continuous shooting and page flipping issues
- Respects rate limiting even after navigation

**Implementation**:
- Bullets use velocity-based movement
- Click detection via `document.elementFromPoint()`
- Automatic click event dispatch on hit
- Works with links, buttons, and clickable elements
- Element click tracking prevents duplicate triggers (500ms cooldown)

### 3. Mode-Specific Themes

**Bell Mode** (`/bell`):
- Purple/pink color scheme
- Quantum particle animations
- Entanglement theme

**Ensemble Mode** (`/ensemble`):
- Orange/amber color scheme (matches game)
- Statistical wave patterns
- Distribution theme

**Individual Mode** (`/individual`):
- Cyan/blue color scheme
- Deterministic ray patterns
- Local systems theme

**Default** (Homepage):
- Blue/cyan color scheme
- General space theme

### 4. Interactive Elements

- **Mode Selection Cards** - Link to mode pages, change ship color
- **Download Buttons** - Triggered by shooting bullets
- **Navigation Links** - All interactive with ship cursor
- **Character Animations** - Einstein and Bell characters floating
- **Comment Form** - Netlify Forms integration for user feedback

### 5. Comment Form

**Location**: Homepage (`app/page.tsx`)

**Features**:
- Netlify Forms integration
- Fields: Name, Email, Comment
- Bot protection (honeypot field)
- Email notifications to `spacebell@willswaystudios.com`
- Styled to match site design
- Success/error messaging
- Form validation

**Configuration**:
- Form name: `comment`
- Email recipient: `spacebell@willswaystudios.com`
- Requires email notification setup in Netlify dashboard
- Submissions viewable in Netlify Forms dashboard

### 6. Custom SVG Icons

**Location**: `public/images/`

**Design Philosophy**:
- Fuses arcade pixel art aesthetic (geometric, blocky shapes) with modern high-definition effects
- Icons use gradients, glows, and abstract scientific representations
- Color schemes match game modes from actual game code
- All icons are SVG format for scalability and performance

**Mode Selection Icons**:
- **Bell Mode** (`bell-mode-icon.svg`): Quantum entanglement theme with connected Bell pair particles (purple/pink gradient #9c27b0, #e91e63)
- **Ensemble Mode** (`ensemble-mode-icon.svg`): Statistical mechanics theme with wave patterns and probability distributions (orange/amber gradient #ff9800, #ffb74d) - matches game color scheme
- **Individual Mode** (`individual-mode-icon.svg`): Deterministic systems theme with precise rays and targeting crosshair (cyan/blue gradient #00bcd4, #2196f3)

**Navigation Icons**:
- **Play Demo** (`play-demo-icon.svg`): Space shooter theme with triangle ship, stars, and bullets
- **Updates** (`updates-icon.svg`): News/document theme with scroll and news badge
- **Early Access** (`early-access-icon.svg`): Lightning/energy theme with energy particles and "EA" badge
- **About** (`about-icon.svg`): Science/research theme with atom structure and electron orbits

**Technical Details**:
- Icons rendered using Next.js `Image` component with `unoptimized` flag (required for static export)
- Mode selection icons: 96x96px
- Navigation icons: 80x80px
- All icons include glow filters and gradient effects matching game's visual style

---

## Component Details

### ShipCursor Component

**Location**: `app/components/ShipCursor.tsx`

**Props**:
- `mode`: 'bell' | 'ensemble' | 'individual' | 'default'
- `onShoot`: Optional callback when bullet hits target

**Features**:
- Mouse tracking and angle calculation
- Bullet creation and animation
- Click detection and triggering
- Canvas rendering with transparency
- Performance optimized (FPS throttling, refs for stability)
- Rate limiting: 1 bullet every 1.5 seconds
- Navigation link handling: Bullets immediately removed when hitting links to prevent continuous shooting
- No element highlighting: Ship cursor doesn't trigger hover effects

### LayoutWrapper Component

**Location**: `app/components/LayoutWrapper.tsx`

**Purpose**:
- Wraps entire application
- Manages current mode state
- Provides ShipCursor to all pages
- Determines mode from pathname

### Page Components

All pages are client-side rendered (`'use client'`) for:
- Interactive features
- Mouse events
- Canvas rendering
- Window size access

---

## Styling

### Tailwind CSS

- Custom color schemes per mode
- Gradient backgrounds
- Animated effects (pulse, shimmer, float)
- Responsive design
- Backdrop blur effects

### Global Styles

**Location**: `app/globals.css`

**Key Styles**:
- `cursor: none !important` - Hides default cursor
- Custom animations (gradient, float, particle, etc.)
- Mode-specific animations
- Smooth transitions

---

## Build Configuration

### next.config.ts

```typescript
{
  output: 'export',        // Static export for Netlify
  images: {
    unoptimized: true     // Required for static export
  }
}
```

### Build Process

```bash
cd "C:\SpaceBell.games\website"
npm run build
```

**Output**: `out/` folder (ready for Netlify)

---

## Deployment

### Netlify Setup

1. **Drag and Drop**
   - Drag `out/` folder to Netlify
   - Wait for upload and processing (3-6 minutes for ~125 MB)

2. **Custom Domain**
   - Add `spacebell.games` in Netlify settings
   - Update DNS records
   - SSL certificate auto-generated

3. **File Structure**
   - All static files in `out/`
   - Demo installer at `out/downloads/SpaceBell-Demo-Setup.exe`
   - All pages pre-rendered

---

## Performance Optimizations

### 1. Static Export
- All pages pre-rendered at build time
- No server-side rendering needed
- Fast page loads

### 2. Client-Side Rendering
- Interactive features only load client-side
- Prevents hydration errors
- Uses `useState` and `useEffect` for client-only code

### 3. Canvas Optimization
- FPS throttling (60 FPS target)
- Refs for stable value access
- Efficient rendering loop
- Transparent canvas overlay

### 4. Code Splitting
- Next.js automatically code-splits
- Each page loads only needed code
- Optimized bundle sizes

---

## Browser Compatibility

### Supported Browsers
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

### Required Features
- Canvas API
- ES6+ JavaScript
- CSS Grid/Flexbox
- RequestAnimationFrame

---

## Accessibility

### Current State
- Keyboard navigation works
- Screen readers can access content
- Semantic HTML used

### Future Improvements
- Add ARIA labels for interactive elements
- Keyboard shortcuts for shooting
- Focus indicators
- Reduced motion options

---

## SEO

### Metadata
- Set in `app/layout.tsx`
- Title and description per page
- Open Graph tags (can be added)

### Current Setup
- Static pages (good for SEO)
- Semantic HTML
- Descriptive page titles

---

## File Sizes

- **Website files**: ~1.3 MB
- **Demo installer**: ~123 MB
- **Total**: ~125 MB

---

## Branding

### Sci-Hy Genre Emphasis

**Homepage**:
- Prominent badge: "Pioneering the Sci-Hy Genre • First Game in This New Category"
- Subtitle: "The First Scientific-Hypothesis Game"
- About card includes: "🌟 First Game in the Sci-Hy Genre"

**About Page**:
- Dedicated section emphasizing SpaceBell as the first Sci-Hy game
- Explains SpaceBell's role in establishing the genre foundation

### Terminology

- **Sci-Hy**: Scientific-Hypothesis Game (not Sci-HyG)
- Used consistently throughout website
- Represents the new genre SpaceBell is pioneering

## Next Steps

See `WEBSITE_UPDATES.md` for:
- How to update content
- How to add new pages
- How to modify design
- How to update demo installer


