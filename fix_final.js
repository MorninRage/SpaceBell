const fs = require('fs');

let content = fs.readFileSync('game.js', 'utf8');

let total = 0;

// Use Unicode escape sequences for corrupted characters
// The arrow â†' is actually U+2192 encoded incorrectly
const replacements = [
    { from: '\u00E2\u0086\u0092', to: '\u2192' }, // UTF-8 bytes for arrow
    { from: '\u00CE\u00A8', to: '\u03A8' }, // Capital Psi
    { from: '\u00CF\u0088', to: '\u03C8' }, // Lowercase psi
    { from: '\u00C2\u00B2', to: '\u00B2' }, // Superscript 2
    { from: '\u00E2\u0080\u00A2', to: '\u2022' }, // Bullet
    { from: '\u00CF\u0084', to: '\u03C4' }, // Tau
];

replacements.forEach(({ from, to }) => {
    const count = (content.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (count > 0) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        total += count;
        console.log(`Fixed ${count} instances`);
    }
});

// Also try direct string search for the actual characters as they appear
// Read file again to get actual bytes
const buffer = fs.readFileSync('game.js');
const arrowBytes = Buffer.from([0xE2, 0x86, 0x92]); // UTF-8 bytes for →
const arrowUnicode = '\u2192';

// Convert buffer to string and replace
let content2 = buffer.toString('utf8');
const arrowPattern = String.fromCharCode(0xE2, 0x86, 0x92);
if (content2.includes(arrowPattern)) {
    const count = content2.split(arrowPattern).length - 1;
    content2 = content2.split(arrowPattern).join(arrowUnicode);
    total += count;
    console.log(`Fixed ${count} arrow characters using byte search`);
    content = content2;
}

fs.writeFileSync('game.js', content, 'utf8');
console.log(`\nTotal fixes: ${total}`);
