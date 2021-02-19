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
const auth_admin = require('./util/auth_admin');


// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

const {getAllTodos,postOneTodo, deleteTodo, editTodo, getOneTodo} = require('./APIs/todos');
const {getAllProducts,postOneProduct, deleteProduct, editProduct, getOneProduct} = require('./APIs/products');
const {loginUser, signUpUser, uploadProfilePhoto, getUserDetail, updateUserDetails, sendVerificationEmail, sendEmailResetPassword} = require('./APIs/users');
const {signUpAdmin, loginAdmin} = require('./APIs/admins');
const { emailSender } = require('./APIs/email');


app.post('/admin/signup', signUpAdmin);
app.post('/admin/login', loginAdmin);

app.get('/admin/products', auth_admin, getAllProducts);
app.get('/admin/product/:productId', auth_admin, getOneProduct);
app.post('/admin/product',auth_admin, postOneProduct);
app.delete('/admin/product/:productId',auth_admin, deleteProduct);
app.put('/admin/product/:productId',auth_admin, editProduct);


app.get('/todos', auth_admin, getAllTodos);
app.get('/todo/:todoId', auth_admin, getOneTodo);
app.post('/todo',auth_admin, postOneTodo);
app.delete('/todo/:todoId',auth_admin, deleteTodo);
app.put('/todo/:todoId',auth_admin, editTodo);


//user
app.post('/user/signup', signUpUser);
app.post('/user/login', loginUser);
app.post('/user/sendemailverivication', sendVerificationEmail);
app.post('/user/resetpassword', sendEmailResetPassword);
app.post('/user/image', auth, uploadProfilePhoto);
app.get('/user', auth, getUserDetail);
app.post('/user', auth, updateUserDetails);

app.post('/emailsender',emailSender);

exports.api = functions.https.onRequest(app);
