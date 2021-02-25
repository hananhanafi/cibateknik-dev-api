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
const {loginUser, signUpUser, uploadProfilePhoto, getUserDetail, updateUserDetails, sendVerificationEmail, sendEmailResetPassword} = require('./APIs/users');
const {signUpAdmin, loginAdmin} = require('./APIs/admins');
const { emailSender } = require('./APIs/email');


app.post('/admin/signup', signUpAdmin);
app.post('/admin/login', loginAdmin);

//admin products
const {getAllProducts,postOneProduct, deleteProduct, editProduct, getOneProduct} = require('./APIs/products');
app.get('/admin/products', getAllProducts);
app.get('/admin/product/:productId', getOneProduct);
app.post('/admin/product',auth_admin, postOneProduct);
app.delete('/admin/product/:productId',auth_admin, deleteProduct);
app.put('/admin/product/:productId',auth_admin, editProduct);
//end admin products


//admin Suppliers
const { getOneSupplier, getAllSuppliers, postOneSupplier, deleteSupplier, editSupplier } = require('./APIs/suppliers');
app.get('/admin/suppliers', getAllSuppliers);
app.get('/admin/supplier/:supplierId', getOneSupplier);
app.post('/admin/supplier',auth_admin, postOneSupplier);
app.delete('/admin/supplier/:supplierId',auth_admin, deleteSupplier);
app.put('/admin/supplier/:supplierId',auth_admin, editSupplier);
//end admin Suppliers

//admin brands
const { getOneBrand, getAllBrands, postOneBrand, deleteBrand, editBrand } = require('./APIs/brands');
app.get('/admin/brands', getAllBrands);
app.get('/admin/brand/:brandId', getOneBrand);
app.post('/admin/brand',auth_admin, postOneBrand);
app.delete('/admin/brand/:brandId',auth_admin, deleteBrand);
app.put('/admin/brand/:brandId',auth_admin, editBrand);
//end admin brands


//admin items
const { postOneItem, getAllItems, getOneItem, deleteItem, editItem } = require('./APIs/items');
app.get('/admin/items', getAllItems);
app.get('/admin/item/:itemId', getOneItem);
app.post('/admin/item',auth_admin, postOneItem);
app.delete('/admin/item/:itemId',auth_admin, deleteItem);
app.put('/admin/item/:itemId',auth_admin, editItem);
//end admin items



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
