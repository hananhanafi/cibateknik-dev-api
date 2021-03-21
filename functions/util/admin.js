const admin = require('firebase-admin');
const fieldValue = admin.firestore.FieldValue; 

const firebase = require('firebase');
const config = require('../util/config');
firebase.initializeApp(config);
admin.initializeApp();

const db = admin.firestore();

module.exports = { admin, db, fieldValue, firebase };