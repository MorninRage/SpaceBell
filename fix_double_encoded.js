const fs = require('fs');

console.log('Fixing double-encoded arrows...');

const buffer = fs.readFileSync('game.js');
let content = buffer.toString('utf8');

// The bytes show: 0xc3 0xa2 0xe2 0x80 0xa0 0xe2 0x80 0x99
// This is: â (double-encoded) + some char + ' (right quote)
// The actual pattern is: â + (char) + '

// Pattern 1: â + (some bytes) + '
const pattern1 = Buffer.from([0xc3, 0xa2, 0xe2, 0x80, 0xa0, 0xe2, 0x80, 0x99]).toString('utf8');
console.log('Pattern 1 bytes:', Array.from(Buffer.from([0xc3, 0xa2, 0xe2, 0x80, 0xa0, 0xe2, 0x80, 0x99])).map(x => '0x' + x.toString(16)).join(' '));

let total = 0;

// Try to find and replace the double-encoded arrow
if (content.includes(pattern1)) {
    const count = content.split(pattern1).length - 1;
    content = content.split(pattern1).join('→');
    total += count;
    console.log(`Fixed ${count} arrows (pattern 1)`);
}

// Also try the individual parts
const part1 = Buffer.from([0xc3, 0xa2]).toString('utf8'); // â
const part2 = Buffer.from([0xe2, 0x80, 0xa0]).toString('utf8');
const part3 = Buffer.from([0xe2, 0x80, 0x99]).toString('utf8'); // '

// Look for the pattern: % space + â + (something) + ' + space + 100%
const fullPattern = '% ' + part1 + part2 + part3 + ' 100%';
if (content.includes(fullPattern)) {
    const count = content.split(fullPattern).length - 1;
    content = content.split(fullPattern).join('% → 100%');
    total += count;
    console.log(`Fixed ${count} arrows (full pattern)`);
}

// Also try just the arrow part in different contexts
const arrowPattern = part1 + part2 + part3;
if (content.includes(arrowPattern)) {
    const count = content.split(arrowPattern).length - 1;
    content = content.split(arrowPattern).join('→');
    total += count;
    console.log(`Fixed ${count} arrows (arrow pattern)`);
}

// Write back
fs.writeFileSync('game.js', content, 'utf8');

console.log(`\nTotal fixes: ${total}`);

// Verify
const remaining = content.split(arrowPattern).length - 1;
console.log(`Remaining: ${remaining}`);
