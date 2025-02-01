const { db } = require('../lib/firebase');
const { collection, getDocs, writeBatch, doc } = require('firebase/firestore');

async function removeViewsFromDatabase() {
  try {
    console.log('Starting to remove views from database...');
    
    // Get all documents from analyzedStreamers collection
    const streamersSnapshot = await getDocs(collection(db, 'analyzedStreamers'));
    const batch = writeBatch(db);
    let count = 0;

    streamersSnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if ('views' in data) {
        // @ts-ignore
        const { views, ...restData } = data;
        batch.set(doc(db, 'analyzedStreamers', docSnapshot.id), restData);
        count++;
      }
    });

    // Get all documents from history collection
    const historySnapshot = await getDocs(collection(db, 'history'));
    historySnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if ('views' in data) {
        // @ts-ignore
        const { views, ...restData } = data;
        batch.set(doc(db, 'history', docSnapshot.id), restData);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Successfully removed views from ${count} documents`);
    } else {
      console.log('No documents found with views field');
    }
  } catch (error) {
    console.error('Error removing views from database:', error);
  }
}

// Execute the function
removeViewsFromDatabase(); 