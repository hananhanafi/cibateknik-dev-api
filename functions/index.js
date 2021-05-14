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


const {loginUser, signUpUser, uploadProfilePhoto, getUserDetail, updateUserDetails, sendVerificationEmail, sendEmailResetPassword, getAllUsers, getToken, logoutUser, updatePasswordUser, adminGetUserDetail} = require('./APIs/users');
//user
app.post('/user/signup', signUpUser);
app.post('/user/login', loginUser);
app.post('/user/logout', logoutUser);
app.post('/user/sendemailverivication', auth, sendVerificationEmail);
app.post('/user/resetpassword', sendEmailResetPassword);
app.post('/user/image', auth, uploadProfilePhoto);
app.get('/user', auth, getUserDetail);
app.put('/user', auth, updateUserDetails);
app.get('/user/token', auth, getToken);
app.post('/user/password/update', auth, updatePasswordUser);

app.get('/users', auth_admin, getAllUsers);
app.get('/admin/data/user/:userID', auth_admin, adminGetUserDetail);

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
app.post('/product/:productID/item/:itemID/stock/update', updateStock);

const { getAllItemsPosted, getAllItemsPostedByProduct, getOneItemPosted, addPostedItem, deletePostedItem, updatePostedItem} = require('./APIs/items_posted');
app.post('/product/:productID/item/:itemID/post',auth_admin, addPostedItem);
app.get('/items-posted', getAllItemsPosted);
app.get('/items-posted/:productID', getAllItemsPostedByProduct);
app.get('/item/posted/:itemID', getOneItemPosted);
app.post('/item/posted/:itemID/update', auth_admin, updatePostedItem);
app.post('/item/posted/delete',auth_admin, deletePostedItem);


const { addCatalogNewestItem, getAllNewestItemsPosted, getAllNewestItemsPostedByProduct, deleteCatalogNewestItem, } = require('./APIs/items_posted_newest');
app.post('/item-posted-newest',auth_admin, addCatalogNewestItem);
app.post('/delete/item-posted-newest',auth_admin, deleteCatalogNewestItem);
app.get('/items-posted-newest', getAllNewestItemsPosted);
app.get('/items-posted-newest/:productID', getAllNewestItemsPostedByProduct);


const { getAllRecommendationItemsPosted, getAllRecommendationItemsPostedByProduct, addCatalogRecommendationItem, deleteCatalogRecommendationItem } = require('./APIs/items_posted_recommenation');
app.post('/item-posted-recommendation',auth_admin, addCatalogRecommendationItem);
app.post('/delete/item-posted-recommendation',auth_admin, deleteCatalogRecommendationItem);
app.get('/items-posted-recommendation', getAllRecommendationItemsPosted);
app.get('/items-posted-recommendation/:productID', getAllRecommendationItemsPostedByProduct);

const { addItemToCart, getUserCart, getUserCartWithItem } = require('./APIs/carts');
app.post('/user/cart/add', auth, addItemToCart);
app.get('/user/cart', auth, getUserCart);
app.get('/user/cart/items', auth, getUserCartWithItem);


const { addWishlist, deleteUserWishlist, getUserWishlist, getUserWishlistWithItem } = require('./APIs/wishlists');
app.post('/user/wishlist/add', auth, addWishlist);
app.post('/user/wishlist/delete', auth, deleteUserWishlist);
app.get('/user/wishlist', auth, getUserWishlist);
app.get('/user/wishlist/items', auth, getUserWishlistWithItem);

const { createUserAddress, getUserAddresses, deleteUserAddress, editUserAddress, updateMainAddress } = require('./APIs/addresses');
app.get('/user/address', auth, getUserAddresses);
app.post('/user/address', auth, createUserAddress);
app.put('/user/address/:addressID', auth,editUserAddress );
app.delete('/user/address/:addressID', auth, deleteUserAddress);
app.post('/user/main-address/update/:addressID', auth, updateMainAddress);

const { getAllAdminMessages, postOneadminMessage, deleteOneAdminMessage } = require('./APIs/admin_messages');
app.get('/admin/messages', auth_admin, getAllAdminMessages);
app.post('/user/admin-message/send',postOneadminMessage);
app.delete('/user/admin-message/delete/:messageID',deleteOneAdminMessage);

const { getDataCityPronvice, getShipmentCost } = require('./APIs/rajaongkir');
app.get('/rajaongkir/data/city-and-province', getDataCityPronvice);
app.get('/rajaongkir/cost', getShipmentCost);


const { createInvoice, updateInvoice, getUserOrder, getAllUsersOrder, updateStatusOrder } = require('./APIs/xendit');
app.post('/user/checkout/invoice/create/:userID', auth, createInvoice);
// app.post('/user/checkout/invoice/update', updateInvoice);
app.get('/user/order/:userID', auth, getUserOrder);
app.get('/admin/users-order', auth_admin, getAllUsersOrder);
app.get('/admin/user-order/:userID', auth_admin, getUserOrder);
app.post('/admin/users-order/status/update/:orderID', auth_admin, updateStatusOrder);

app.post('/item/sold',auth_admin, updateSoldItem);
app.delete('/item/sold/delete',auth_admin, deleteSoldItem);

//end admin items


exports.api = functions.https.onRequest(app);
