// Simple audio converter using Node.js
// This script converts audio files to OGG format
// Requires: npm install fluent-ffmpeg (or use online converter)

const fs = require('fs');
const path = require('path');

// Get the file from command line argument
const inputFile = process.argv[2];
const outputFile = process.argv[3] || inputFile.replace(/\.[^/.]+$/, '.ogg');

if (!inputFile) {
    console.log('Usage: node convert_audio.js <input_file> [output_file.ogg]');
    console.log('Example: node convert_audio.js "C:\\Users\\Limin\\Downloads\\music.mp3" "bell-game\\music\\main_theme.ogg"');
    process.exit(1);
}

if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found: ${inputFile}`);
    process.exit(1);
}

console.log(`Converting: ${inputFile}`);
console.log(`Output: ${outputFile}`);

// Try to use FFmpeg if available
const { exec } = require('child_process');

// Check if ffmpeg is available
exec('ffmpeg -version', (error) => {
    if (error) {
        console.log('\nFFmpeg not found. Please use one of these options:');
        console.log('\nOption 1: Install FFmpeg');
        console.log('  1. Download from: https://ffmpeg.org/download.html');
        console.log('  2. Or use: winget install ffmpeg');
        console.log('  3. Then run this script again');
        console.log('\nOption 2: Use Online Converter');
        console.log('  1. Go to: https://convertio.co/audio-converter/');
        console.log('  2. Upload your file');
        console.log('  3. Select OGG format');
        console.log('  4. Download and place in bell-game/music/ folder');
        console.log('\nOption 3: Use Audacity (Free)');
        console.log('  1. Download from: https://www.audacityteam.org');
        console.log('  2. Open your audio file');
        console.log('  3. File → Export → Export as OGG');
        console.log('  4. Save to bell-game/music/ folder');
        process.exit(1);
    }
    
    // FFmpeg is available, convert the file
    const ffmpegCmd = `ffmpeg -i "${inputFile}" -acodec libvorbis -q:a 5 "${outputFile}"`;
    
    console.log('\nConverting with FFmpeg...');
    exec(ffmpegCmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error converting: ${error.message}`);
            process.exit(1);
        }
        console.log('\n✓ Conversion complete!');
        console.log(`Output file: ${outputFile}`);
        
        // Check if output file exists
        if (fs.existsSync(outputFile)) {
            const stats = fs.statSync(outputFile);
            console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        }
    });
});












