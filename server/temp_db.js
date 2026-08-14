const mongoose = require('mongoose');
mongoose.connect('mongodb://newpenal:Aapw%26k5R5Gs%26vnT@151.242.51.118:27017/payment_portal?authSource=admin').then(async () => {
    const Payment = mongoose.model('Payment', new mongoose.Schema({
        panelId: mongoose.Schema.Types.ObjectId,
        paymentType: String,
        timestamp: Date,
        createdAt: Date,
        date: String
    }, { strict: false }));
    
    const Panel = mongoose.model('Panel', new mongoose.Schema({
        panelName: String
    }, { strict: false }));
    
    const panels = await Panel.find({ panelName: { $in: ['tools.expertalgo', 'tools.flyertechsoftware', 'deepmind'] }});
    for (const p of panels) {
        const pays = await Payment.find({ panelId: p._id }).sort({ createdAt: -1 }).limit(5);
        console.log(p.panelName);
        pays.forEach(pay => {
            console.log(` - type: ${pay.paymentType} | timestamp:`, pay.timestamp, '| createdAt:', pay.createdAt, '| date:', pay.date);
        });
    }
    process.exit(0);
}).catch(console.error);
