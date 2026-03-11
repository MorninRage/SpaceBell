const fs = require('fs');

console.log('Fixing arrow characters...');

const content = fs.readFileSync('game.js', 'utf8');

// The pattern is: â (U+00E2) + † (U+2020) + ' (U+2019)
// Create it using character codes
const badPattern = String.fromCharCode(0x00E2) + String.fromCharCode(0x2020) + String.fromCharCode(0x2019);
const goodArrow = '→';

console.log('Bad pattern length:', badPattern.length);
console.log('Bad pattern bytes:', Buffer.from(badPattern, 'utf8').map(b => '0x' + b.toString(16)).join(' '));

// Count before
const before = content.split(badPattern).length - 1;
console.log('Found', before, 'instances to fix');

// Replace all instances
const fixed = content.split(badPattern).join(goodArrow);

// Count after
const after = fixed.split(badPattern).length - 1;
console.log('After replacement:', after, 'remaining');

// Write back
fs.writeFileSync('game.js', fixed, 'utf8');

console.log('Fixed', before - after, 'arrow characters');

// Verify on specific lines
const lines = fixed.split('\n');
const line13498 = lines[13497];
const line35409 = lines[35408];

console.log('\nVerification:');
console.log('Line 13498 has →:', line13498.includes('→'));
console.log('Line 13498 has bad pattern:', line13498.includes(badPattern));
console.log('Line 35409 has →:', line35409.includes('→'));
console.log('Line 35409 has bad pattern:', line35409.includes(badPattern));
