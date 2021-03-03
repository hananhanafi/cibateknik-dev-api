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
app.get('/products', getAllProducts);
app.get('/product/:productId', getOneProduct);
app.post('/product',auth_admin, postOneProduct);
app.delete('/product/:productId',auth_admin, deleteProduct);
app.put('/product/:productId',auth_admin, editProduct);
//end admin products


//admin Suppliers
const { getOneSupplier, getAllSuppliers, postOneSupplier, deleteSupplier, editSupplier } = require('./APIs/suppliers');
app.get('/suppliers', getAllSuppliers);
app.get('/supplier/:supplierId', getOneSupplier);
app.post('/supplier',auth_admin, postOneSupplier);
app.delete('/supplier/:supplierId',auth_admin, deleteSupplier);
app.put('/supplier/:supplierId',auth_admin, editSupplier);
//end admin Suppliers

//admin brands
const { getOneBrand, getAllBrands, postOneBrand, deleteBrand, editBrand } = require('./APIs/brands');
app.get('/brands', getAllBrands);
app.get('/brand/:brandId', getOneBrand);
app.post('/brand',auth_admin, postOneBrand);
app.delete('/brand/:brandId',auth_admin, deleteBrand);
app.put('/brand/:brandId',auth_admin, editBrand);
//end admin brands


//admin items
const { postOneItem, getAllItems, getOneItem, deleteItem, editItem, updatePostedItem, deletePostedItem, updateSoldItem, deleteSoldItem } = require('./APIs/items');
app.get('/items', getAllItems);
app.get('/item/:itemId', getOneItem);
app.post('/item',auth_admin, postOneItem);
app.delete('/item/:itemId',auth_admin, deleteItem);
app.put('/item/:itemId',auth_admin, editItem);

app.post('/item/post',auth_admin, updatePostedItem);
app.delete('/item/post/delete',auth_admin, deletePostedItem);

app.post('/item/sold',auth_admin, updateSoldItem);
app.delete('/item/sold/delete',auth_admin, deleteSoldItem);

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
