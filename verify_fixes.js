const fs = require('fs');

const content = fs.readFileSync('game.js', 'utf8');
const lines = content.split('\n');

// Check specific problem lines
const checkLines = [35408, 35409, 13497, 13498, 42688, 42689];

console.log('Checking specific problem lines:\n');

checkLines.forEach(lineNum => {
    const line = lines[lineNum - 1]; // Convert to 0-based index
    if (line) {
        const hasCorrectArrow = line.includes('→');
        const hasCorruptedArrow = line.includes('\u00E2\u0086\u0092') || 
                                  line.includes(Buffer.from([0xE2, 0x86, 0x92]).toString('utf8'));
        
        console.log(`Line ${lineNum}:`);
        console.log(`  Has correct arrow (→): ${hasCorrectArrow}`);
        console.log(`  Has corrupted arrow: ${hasCorruptedArrow}`);
        if (hasCorruptedArrow && !hasCorrectArrow) {
            console.log(`  ⚠️  NEEDS FIX`);
        } else if (hasCorrectArrow) {
            console.log(`  ✅ OK`);
        }
        console.log('');
    }
});

// Overall statistics
const stats = {
    correctArrows: (content.match(/→/g) || []).length,
    corruptedArrows: (content.match(/\u00E2\u0086\u0092/g) || []).length,
    correctPsi: (content.match(/Ψ/g) || []).length,
    corruptedPsi: (content.match(/\u00CE\u00A8/g) || []).length,
    correctPsiLower: (content.match(/ψ/g) || []).length,
    corruptedPsiLower: (content.match(/\u00CF\u0088/g) || []).length,
    correctSup2: (content.match(/²/g) || []).length,
    corruptedSup2: (content.match(/\u00C2\u00B2/g) || []).length,
    correctBullet: (content.match(/•/g) || []).length,
    corruptedBullet: (content.match(/\u00E2\u0080\u00A2/g) || []).length,
    correctTau: (content.match(/τ/g) || []).length,
    corruptedTau: (content.match(/\u00CF\u0084/g) || []).length
};

console.log('Overall Statistics:');
console.log(`  Arrows: ${stats.correctArrows} correct, ${stats.corruptedArrows} corrupted`);
console.log(`  Capital Psi: ${stats.correctPsi} correct, ${stats.corruptedPsi} corrupted`);
console.log(`  Lowercase psi: ${stats.correctPsiLower} correct, ${stats.corruptedPsiLower} corrupted`);
console.log(`  Superscript 2: ${stats.correctSup2} correct, ${stats.corruptedSup2} corrupted`);
console.log(`  Bullet: ${stats.correctBullet} correct, ${stats.corruptedBullet} corrupted`);
console.log(`  Tau: ${stats.correctTau} correct, ${stats.corruptedTau} corrupted`);

const allFixed = stats.corruptedArrows === 0 && stats.corruptedPsi === 0 && 
                 stats.corruptedPsiLower === 0 && stats.corruptedSup2 === 0 &&
                 stats.corruptedBullet === 0 && stats.corruptedTau === 0;

if (allFixed) {
    console.log('\n✅ All encoding issues are fixed!');
} else {
    console.log('\n⚠️  Some corrupted characters remain.');
}
