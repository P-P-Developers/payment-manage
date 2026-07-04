const fs = require('fs');

const ipFile = 'ip.js';
let content = fs.readFileSync(ipFile, 'utf-8');

const newData = fs.readFileSync('new_ip_data.json', 'utf-8');

// Find the start of Ip_data
const startIndex = content.indexOf('let Ip_data = [');
if (startIndex === -1) {
    console.error('Could not find Ip_data definition');
    process.exit(1);
}

// Find the end of the Ip_data array by looking for `\n]\n\n\n` or similar. 
// We know it ends before `const normalize = (str) => {`
const normalizeIndex = content.indexOf('const normalize = (str) => {');

// The array ends just before the normalize function. 
// We can just slice it. Let's find the last `]` before `normalizeIndex`.
const substring = content.substring(startIndex, normalizeIndex);
const lastBracketIndex = substring.lastIndexOf(']');

const before = content.substring(0, startIndex);
const after = content.substring(startIndex + lastBracketIndex + 1);

const newContent = before + 'let Ip_data = ' + newData + after;

fs.writeFileSync(ipFile, newContent);
console.log('Successfully updated ip.js with new Ip_data!');
