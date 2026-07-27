const { MongoClient } = require('mongodb');

const args = process.argv.slice(2);
const command = args[0];


// node server/scripts/dbsync.js live-to-local

// node server/scripts/dbsync.js local-to-live


// Define your URIs here
const LIVE_URI = 'mongodb://payment_portal:Gyth7658UIjh@151.242.51.182:27017/payment_portal?authSource=admin';
const LOCAL_URI = 'mongodb://newpenal:Aapw%26k5R5Gs%26vnT@151.242.51.118:27017/'; // Change to 'mongodb://127.0.0.1:27017/' if your local DB is running on localhost
const DB_NAME = 'payment_portal';

let SOURCE_URI, DEST_URI;

if (command === 'live-to-local') {
    SOURCE_URI = LIVE_URI;
    DEST_URI = LOCAL_URI;
    console.log('Mode: Syncing from LIVE to LOCAL...');
} else if (command === 'local-to-live') {
    SOURCE_URI = LOCAL_URI;
    DEST_URI = LIVE_URI;
    console.log('Mode: Syncing from LOCAL to LIVE...');
} else {
    console.error('Error: Please provide a valid sync direction.');
    console.error('Usage: node dbsync.js live-to-local');
    console.error('   OR: node dbsync.js local-to-live');
    process.exit(1);
}

const SOURCE_DB_NAME = DB_NAME;
const DEST_DB_NAME = DB_NAME;

async function syncDatabase() {
    const sourceClient = new MongoClient(SOURCE_URI);
    const destClient = new MongoClient(DEST_URI);

    try {
        console.log('Connecting to Source Database...');
        await sourceClient.connect();
        console.log('Successfully connected to Source Database.');

        console.log('Connecting to Destination Database...');
        await destClient.connect();
        console.log('Successfully connected to Destination Database.');

        const sourceDb = sourceClient.db(SOURCE_DB_NAME);
        const destDb = destClient.db(DEST_DB_NAME);

        // Get all collections from the source database
        const collectionsInfo = await sourceDb.listCollections().toArray();
        const collectionNames = collectionsInfo.map(c => c.name);

        console.log(`Found ${collectionNames.length} collections to sync: ${collectionNames.join(', ')}`);

        for (const collectionName of collectionNames) {
            console.log(`\n----------------------------------------`);
            console.log(`Starting sync for collection: [${collectionName}]`);

            const sourceCollection = sourceDb.collection(collectionName);
            const destCollection = destDb.collection(collectionName);

            // Fetch all documents from the source collection
            const documents = await sourceCollection.find({}).toArray();
            console.log(`Fetched ${documents.length} documents from source [${collectionName}].`);

            if (documents.length === 0) {
                console.log(`Skipping empty collection: [${collectionName}]`);
                continue;
            }

            let upsertCount = 0;

            // Sync documents using bulkWrite for efficiency and speed
            const bulkOps = documents.map(doc => ({
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: doc },
                    upsert: true
                }
            }));

            // Split bulk operations into chunks of 1000 to prevent BSON limit issues
            const chunkSize = 1000;
            for (let i = 0; i < bulkOps.length; i += chunkSize) {
                const chunk = bulkOps.slice(i, i + chunkSize);
                const result = await destCollection.bulkWrite(chunk, { ordered: false });
                upsertCount += (result.modifiedCount + result.upsertedCount + (result.matchedCount - result.modifiedCount));
            }

            console.log(`Successfully synced [${collectionName}]: processed ${upsertCount} documents.`);
        }

        console.log(`\n========================================`);
        console.log('Database synchronization completed successfully!');

    } catch (error) {
        console.error('An error occurred during DB sync:', error);
    } finally {
        await sourceClient.close();
        await destClient.close();
        console.log('Database connections closed.');
    }
}

syncDatabase();
