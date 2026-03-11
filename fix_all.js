const fs = require('fs');

// Read file
let content = fs.readFileSync('game.js', 'utf8');

// Function to find and replace corrupted arrow sequences
// The arrow might be encoded as different byte sequences
function fixArrow(text) {
    // Try various encodings of the arrow character
    const arrowPatterns = [
        /\u00E2\u0086\u0092/g,  // UTF-8: â†'
        /\u2192/g,              // Unicode: →
        /â†'/g,                  // Literal corrupted sequence
        /\u2192/g               // Direct Unicode
    ];
    
    arrowPatterns.forEach(pattern => {
        text = text.replace(pattern, '→');
    });
    
    return text;
}

// Apply fixes
content = fixArrow(content);

// Also fix other characters
content = content.replace(/Î¨/g, 'Ψ');
content = content.replace(/Ïˆ/g, 'ψ');
content = content.replace(/Â²/g, '²');
content = content.replace(/â€¢/g, '•');
content = content.replace(/Ï„/g, 'τ');

// Write back
fs.writeFileSync('game.js', content, 'utf8');
console.log('All fixes applied');
