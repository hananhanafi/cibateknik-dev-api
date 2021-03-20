const admin = require('firebase-admin');
const fieldValue = admin.firestore.FieldValue; 

admin.initializeApp();

const db = admin.firestore();

module.exports = { admin, db, fieldValue };