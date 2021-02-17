// const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require('firebase-functions');
const app = require('express')();
const cors = require('cors');
const auth = require('./util/auth');


// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

const {getAllTodos,postOneTodo, deleteTodo, editTodo} = require('./APIs/todos');
const {loginUser, signUpUser, uploadProfilePhoto, getUserDetail, updateUserDetails} = require('./APIs/users');


app.get('/todos', auth, getAllTodos);
// app.get('/todo/:todoId', auth, getOneTodo);
app.post('/todo',auth, postOneTodo);
app.delete('/todo/:todoId',auth, deleteTodo);
app.put('/todo/:todoId',auth, editTodo);

//user
app.post('/login', loginUser);
app.post('/signup', signUpUser);
app.post('/user/image', auth, uploadProfilePhoto);
app.get('/user', auth, getUserDetail);
app.post('/user', auth, updateUserDetails);

exports.api = functions.https.onRequest(app);
