const fs = require('fs');

const content = fs.readFileSync('IP_Allotment_History_2026-07-04.xls', 'utf-8');

const regex = /<tr>[\s\S]*?<td>(.*?)<\/td>[\s\S]*?<td><b>(.*?)<\/b>[\s\S]*?<\/td>[\s\S]*?<td.*?>.*?<\/td>[\s\S]*?<td.*?>.*?<\/td>[\s\S]*?<td>(\d+) IPs?<\/td>/g;
let match;
const data = [];

// parse custom date "DD-MM-YYYY hh:mm A" to standard date
const parseDate = (str) => {
    const parts = str.split(' ');
    const d = parts[0].split('-'); // DD, MM, YYYY
    const time = parts[1].split(':'); // hh, mm
    const isPM = parts[2] === 'PM';
    
    let hours = parseInt(time[0], 10);
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    const date = new Date(parseInt(d[2], 10), parseInt(d[1], 10) - 1, parseInt(d[0], 10), hours, parseInt(time[1], 10));
    return date.toISOString();
};

while ((match = regex.exec(content)) !== null) {
    data.push({
        createdAt: parseDate(match[1]),
        panel_name: match[2].trim(),
        count: parseInt(match[3], 10)
    });
}

fs.writeFileSync('new_ip_data.json', JSON.stringify(data, null, 4));
console.log(`Extracted ${data.length} records.`);
