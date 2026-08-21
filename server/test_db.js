const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/payment-manage-db').then(async () => {
    try {
        const panel = await mongoose.connection.db.collection('panels').findOne({panelName: 'nexteraresearch'});
        if (panel) {
            const payments = await mongoose.connection.db.collection('payments').find({panelId: panel._id, paymentType: 'IP Charges'}).toArray();
            console.log(JSON.stringify(payments.slice(-5), null, 2)); // latest 5
        } else {
            console.log("Panel not found");
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
