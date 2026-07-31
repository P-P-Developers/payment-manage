const fs = require('fs');
let content = fs.readFileSync('routes/sync.js', 'utf8');

const targetStr = `                const isExisting = panelPayments.some(pay => {
                    const amtRecv = parseFloat(pay.amountReceived) || 0;
                    const bAmt = parseFloat(pay.billAmount) || 0;
                    const uPrice = parseFloat(pay.unitPrice) || 0;
                    const amtWithGst = parseFloat((sopAmount + (sopAmount * 0.18)).toFixed(2));
                    
                    const amtMatches = bAmt === sopAmount || bAmt === amtWithGst ||
                        amtRecv === sopAmount || amtRecv === amtWithGst ||
                        uPrice === sopAmount || uPrice === amtWithGst;`;

const replacementStr = `                const isExisting = panelPayments.some(pay => {
                    const bAmt = parseFloat(pay.billAmount) || 0;
                    const amtWithGst = parseFloat((sopAmount + (sopAmount * 0.18)).toFixed(2));
                    
                    const amtMatches = bAmt === sopAmount || bAmt === amtWithGst;`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('routes/sync.js', content);
    console.log('Successfully updated sync.js directly!');
} else {
    console.log('Target string not found in sync.js');
}
