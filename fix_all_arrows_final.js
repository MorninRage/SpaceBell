const fs = require('fs');

console.log('Final comprehensive arrow fix...');

const buffer = fs.readFileSync('game.js');
let content = buffer.toString('utf8');

let total = 0;

// The corrupted arrow is 3 bytes: E2 86 92
const corruptedArrow = Buffer.from([0xE2, 0x86, 0x92]).toString('utf8');
const correctArrow = '→';

// Count before
const before = {
    corrupted: content.split(corruptedArrow).length - 1,
    correct: (content.match(/→/g) || []).length
};

console.log('Before:', before);

// Fix ALL instances - be very aggressive
// Method 1: Direct replacement
if (content.includes(corruptedArrow)) {
    const count = content.split(corruptedArrow).length - 1;
    content = content.split(corruptedArrow).join(correctArrow);
    total += count;
    console.log(`Fixed ${count} arrows (direct)`);
}

// Method 2: Unicode escape
const unicodeCorrupted = '\u00E2\u0086\u0092';
if (content.includes(unicodeCorrupted)) {
    const count = content.split(unicodeCorrupted).length - 1;
    content = content.split(unicodeCorrupted).join(correctArrow);
    total += count;
    console.log(`Fixed ${count} arrows (unicode)`);
}

// Method 3: Fix specific patterns in context
const patterns = [
    { from: '% ' + corruptedArrow + ' ', to: '% → ', name: 'after percent with space' },
    { from: '%' + corruptedArrow + ' ', to: '%→ ', name: 'after percent no space' },
    { from: corruptedArrow + ' |', to: '→ |', name: 'before pipe' },
    { from: corruptedArrow + ' 100%', to: '→ 100%', name: 'before 100%' },
    { from: "'" + corruptedArrow + "'", to: "'→'", name: 'in single quotes' },
    { from: '"' + corruptedArrow + '"', to: '"→"', name: 'in double quotes' },
    { from: 'system ' + corruptedArrow, to: 'system →', name: 'after system' },
    { from: '(x,t) ' + corruptedArrow, to: '(x,t) →', name: 'after (x,t)' }
];

patterns.forEach(({ from, to, name }) => {
    if (content.includes(from)) {
        const count = content.split(from).length - 1;
        content = content.split(from).join(to);
        total += count;
        console.log(`Fixed ${count} arrows (${name})`);
    }
});

// Method 4: One more pass for any remaining
if (content.includes(corruptedArrow)) {
    const count = content.split(corruptedArrow).length - 1;
    content = content.split(corruptedArrow).join(correctArrow);
    total += count;
    console.log(`Fixed ${count} remaining arrows`);
}

// Write back
fs.writeFileSync('game.js', content, 'utf8');

// Verify
const after = {
    corrupted: content.split(corruptedArrow).length - 1,
    correct: (content.match(/→/g) || []).length
};

console.log('\nAfter:', after);
console.log(`Total fixes: ${total}`);

if (after.corrupted === 0) {
    console.log('\n✅ All arrows fixed!');
} else {
    console.log(`\n⚠️  ${after.corrupted} corrupted arrows still remain.`);
    console.log('Trying alternative encoding detection...');
    
    // Try to find what the actual bytes are
    const sample = content.substring(content.indexOf('Durability'), content.indexOf('Durability') + 50);
    console.log('Sample around "Durability":', JSON.stringify(sample));
}
