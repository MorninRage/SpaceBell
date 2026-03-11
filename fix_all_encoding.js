const fs = require('fs');

console.log('Starting comprehensive encoding fix...');

// Read file
const buffer = fs.readFileSync('game.js');
let content = buffer.toString('utf8');

const originalLength = content.length;
let totalFixed = 0;

// Function to fix a specific pattern
function fixPattern(content, fromBytes, toChar, name) {
    const fromString = Buffer.from(fromBytes).toString('utf8');
    if (content.includes(fromString)) {
        const count = content.split(fromString).length - 1;
        content = content.split(fromString).join(toChar);
        totalFixed += count;
        console.log(`Fixed ${count} instances of ${name}`);
    }
    return content;
}

// Fix arrow (E2 86 92 = →)
content = fixPattern(content, [0xE2, 0x86, 0x92], '\u2192', 'arrow');

// Fix capital Psi (CE A8 = Ψ)
content = fixPattern(content, [0xCE, 0xA8], '\u03A8', 'capital Psi');

// Fix lowercase psi (CF 88 = ψ)
content = fixPattern(content, [0xCF, 0x88], '\u03C8', 'lowercase psi');

// Fix superscript 2 (C2 B2 = ²)
content = fixPattern(content, [0xC2, 0xB2], '\u00B2', 'superscript 2');

// Fix bullet (E2 80 A2 = •)
content = fixPattern(content, [0xE2, 0x80, 0xA2], '\u2022', 'bullet');

// Fix tau (CF 84 = τ)
content = fixPattern(content, [0xCF, 0x84], '\u03C4', 'tau');

// Also try Unicode escape sequences as strings
const unicodeFixes = [
    { from: '\u00E2\u0086\u0092', to: '\u2192', name: 'arrow (unicode)' },
    { from: '\u00CE\u00A8', to: '\u03A8', name: 'capital Psi (unicode)' },
    { from: '\u00CF\u0088', to: '\u03C8', name: 'lowercase psi (unicode)' },
    { from: '\u00C2\u00B2', to: '\u00B2', name: 'superscript 2 (unicode)' },
    { from: '\u00E2\u0080\u00A2', to: '\u2022', name: 'bullet (unicode)' },
    { from: '\u00CF\u0084', to: '\u03C4', name: 'tau (unicode)' }
];

unicodeFixes.forEach(({ from, to, name }) => {
    if (content.includes(from)) {
        const count = content.split(from).length - 1;
        content = content.split(from).join(to);
        totalFixed += count;
        console.log(`Fixed ${count} instances of ${name}`);
    }
});

// Write back
fs.writeFileSync('game.js', content, 'utf8');

console.log(`\nTotal fixes applied: ${totalFixed}`);
console.log(`File size: ${originalLength} → ${content.length} bytes`);

// Final verification
const verify = {
    arrowBytes: (content.match(/\u00E2\u0086\u0092/g) || []).length,
    arrowCorrect: (content.match(/\u2192/g) || []).length,
    psiBytes: (content.match(/\u00CE\u00A8/g) || []).length,
    psiCorrect: (content.match(/\u03A8/g) || []).length,
    psiLowerBytes: (content.match(/\u00CF\u0088/g) || []).length,
    psiLowerCorrect: (content.match(/\u03C8/g) || []).length
};

console.log('\nVerification:');
console.log(`  Arrow: ${verify.arrowBytes} corrupted, ${verify.arrowCorrect} correct`);
console.log(`  Capital Psi: ${verify.psiBytes} corrupted, ${verify.psiCorrect} correct`);
console.log(`  Lowercase psi: ${verify.psiLowerBytes} corrupted, ${verify.psiLowerCorrect} correct`);

if (verify.arrowBytes === 0 && verify.psiBytes === 0 && verify.psiLowerBytes === 0) {
    console.log('\n✅ All encoding issues fixed!');
} else {
    console.log('\n⚠️  Some corrupted characters may remain. They may be encoded differently.');
}
