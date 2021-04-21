const functions = require('firebase-functions');
// const app = require('express')();
const cors = require('cors');
const auth = require('./util/auth');
const auth_admin = require('./util/auth_admin');
const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));


const { loginAdmin, signUpAdmin } = require('./APIs/admins');
app.post('/admin/login', loginAdmin);
app.post('/admin/signup', signUpAdmin);


const {loginUser, signUpUser, uploadProfilePhoto, getUserDetail, updateUserDetails, sendVerificationEmail, sendEmailResetPassword, getAllUsers, getToken} = require('./APIs/users');
//user
app.post('/user/signup', signUpUser);
app.post('/user/login', loginUser);
app.post('/user/sendemailverivication', sendVerificationEmail);
app.post('/user/resetpassword', sendEmailResetPassword);
app.post('/user/image', auth, uploadProfilePhoto);
app.get('/user', auth, getUserDetail);
app.put('/user', auth, updateUserDetails);
app.get('/user/token', auth, getToken);

app.get('/users', auth_admin, getAllUsers);

//admin products
const {getAllProducts,postOneProduct, deleteProduct, editProduct, getOneProduct} = require('./APIs/products');
app.get('/products', getAllProducts);
app.get('/product/:productID', getOneProduct);
app.post('/product',auth_admin, postOneProduct);
app.delete('/product/:productID',auth_admin, deleteProduct);
app.put('/product/:productID',auth_admin, editProduct);
//end admin products

//admin Suppliers
const { getOneSupplier, getAllSuppliers, postOneSupplier, deleteSupplier, editSupplier } = require('./APIs/suppliers');
app.get('/suppliers', getAllSuppliers);
app.get('/supplier/:supplierID', getOneSupplier);
app.post('/supplier',auth_admin, postOneSupplier);
app.delete('/supplier/:supplierID',auth_admin, deleteSupplier);
app.put('/supplier/:supplierID',auth_admin, editSupplier);
//end admin Suppliers

//admin brands
const { getOneBrand, getAllBrands, postOneBrand, deleteBrand, editBrand } = require('./APIs/brands');
app.get('/brands', getAllBrands);
app.get('/brand/:brandID', getOneBrand);
app.post('/brand',auth_admin, postOneBrand);
app.delete('/brand/:brandID',auth_admin, deleteBrand);
app.put('/brand/:brandID',auth_admin, editBrand);
//end admin brands

//admin categories
const { getOneCategory, getAllCategories, postOneCategory, deleteCategory, editCategory } = require('./APIs/categories');
app.get('/categories', getAllCategories);
app.get('/category/:categoryID', getOneCategory);
app.post('/category',auth_admin, postOneCategory);
app.delete('/category/:categoryID',auth_admin, deleteCategory);
app.put('/category/:categoryID',auth_admin, editCategory);
//end admin categories

//admin items
const { postOneItem, getAllItemsByProduct, getOneItem, deleteItem, editItem, updateSoldItem, deleteSoldItem, updateMonthlyStock, updateStock, uploadImage, deleteItemImage, getAllDataItems } = require('./APIs/items');
app.get('/product/:productID/items', getAllItemsByProduct);
app.get('/product/:productID/data/items', getAllDataItems);
app.get('/product/:productID/item/:itemID', getOneItem);

app.post('/product/:productID/item', auth_admin, postOneItem);
app.post('/product/:productID/item/:itemID/images', auth_admin, uploadImage);
app.post('/product/:productID/item/:itemID/images/delete', auth_admin, deleteItemImage);
app.put('/product/:productID/item/:itemID', auth_admin, editItem);
app.delete('/product/:productID/item/:itemID', auth_admin, deleteItem);

app.post('/product/:productID/item/:itemID/stock/monthly', auth_admin, updateMonthlyStock);
app.post('/product/:productID/item/:itemID/stock/update', auth_admin, updateStock);

const { getAllItemsPosted, getAllItemsPostedByProduct, getOneItemPosted, addPostedItem, deletePostedItem, updatePostedItem, } = require('./APIs/items_posted');
app.post('/product/:productID/item/:itemID/post',auth_admin, addPostedItem);
app.get('/items-posted', getAllItemsPosted);
app.get('/items-posted/:productID', getAllItemsPostedByProduct);
app.get('/item/posted/:itemID', getOneItemPosted);
app.post('/item/posted/:itemID/update', auth_admin, updatePostedItem);
app.delete('/item/posted/delete',auth_admin, deletePostedItem);


app.post('/item/sold',auth_admin, updateSoldItem);
app.delete('/item/sold/delete',auth_admin, deleteSoldItem);

//end admin items


exports.api = functions.https.onRequest(app);
