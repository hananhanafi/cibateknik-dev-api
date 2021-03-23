const { db, fieldValue } = require('../util/admin');
const { createSubstringArray } = require('../util/helpers');

exports.getAllProducts = async (request, response) => {
    const queryRequest = request.query;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    const search = queryRequest.search;
    const limit = queryRequest.limit ? queryRequest.limit : 10;

    //query get all data for counting total data
    let queryGetAll = db.collection('products').orderBy('createdAt', order);
    
    //query get limited data for pagination
    let queryGetData = db.collection('products')
    .orderBy('createdAt', order)
    .limit(limit);
    
    if(search){
        queryGetAll = db.collection('products')
        .orderBy('createdAt', order)
        .where("searchKeywordsArray", "array-contains", search.toLowerCase())

        queryGetData = db.collection('products')
        .orderBy('createdAt', order)
        .where("searchKeywordsArray", "array-contains", search.toLowerCase())
        .limit(limit);
        
    }

    const snapshot = await queryGetAll.get();
    const total = snapshot.docs.length;
    const first_page = 1;
    const last_page = Math.ceil(total/limit);
    const current_page = queryRequest.page ? queryRequest.page : 1;


    let first_index = total > 0 ? 1 : 0 ;
    let last_index = total > limit ? limit : total;

    
    if(current_page>1){
        if(search){
            const first = db.collection('products')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];

            queryGetData = db.collection('products')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .startAfter(last.data().createdAt)
            .limit(limit)
        }else{
            const first = db.collection('products')
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
            
            queryGetData = db.collection('products')
            .orderBy('createdAt', order)
            .startAfter(last.data().createdAt)
            .limit(limit)
        }

        const snapshot = await queryGetData.get();
        first_index = ((limit*current_page)-(limit-1));
        last_index = first_index + snapshot.docs.length-1;
    }

    queryGetData.get()
    .then((data) => {
        let products = {
            data:[],
            meta: {
                first_index: first_index,
                last_index: last_index,
                current_page: parseInt(current_page),
                first_page: first_page,
                last_page: last_page,
                total: total,
            }
        };
        data.forEach((doc) => {
            products.data.push({
                productID: doc.id,
                name: doc.data().name,
                additionalData: doc.data().additionalData,
                createdAt: doc.data().createdAt,
                updatedAt: doc.data().updatedAt,
            });
        });
        return response.json(products);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
};

exports.postOneProduct = async (request, response) => {

    try {
        
        if (request.body.name == undefined || request.body.name.trim() === '') {
            return response.status(400).json({ name: 'Must not be empty' });
        }
        
        const newProductItem = {
            name: request.body.name ? request.body.name : null,
            additionalData: request.body.additionalData ? request.body.additionalData : [] ,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        
        const res = request.body.name.toLowerCase().split(" ");
        const nameArr = res.filter(item=>{
            return item!="";
        })
        
        const searchKeywordsArray = await createSubstringArray(newProductItem.name);
        newProductItem.searchKeywordsArray = searchKeywordsArray;

        const idProduct = nameArr.join("-");
        
        const productsRef = db.collection('products');
        const product = await productsRef.where('name', '==', newProductItem.name).limit(1).get();

        if(product.empty){
            db
            .collection('products')
            .doc(idProduct)
            .set(newProductItem)
            .then((doc)=>{
                const responseProductItem = newProductItem;
                delete responseProductItem.searchKeywordsArray;
                responseProductItem.id = doc.id;
                return response.json(responseProductItem);
            })
            .catch((err) => {
                response.status(500).json({ error: 'Something went wrong' });
                console.error(err);
            });

        }else{
            return response.status(400).json({ product: 'Produk ' + newProductItem.name + ' sudah ada' });
        }
        
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
};

exports.getOneProduct = (request, response) => {
    const document = db.doc(`/products/${request.params.productID}`);
    document
    .get()
    .then((doc) => {
        if (!doc.exists) {
            return response.status(404).json({ error: 'Produk tidak ditemukan' })
        }
        
        if (doc.exists) {
            productData = doc.data();
            return response.json(productData);
        }	
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err.code });
    });
};

exports.deleteProduct = (request, response) => {
    const productID = request.params.productID;
    const document = db.doc(`/products/${productID}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Produk tidak ditemukan' })
            }
            
            db.collection('items').where('productID','==',productID).get()
            .then(function(querySnapshot) {
                // Once we get the results, begin a batch
                var batch = db.batch();

                querySnapshot.forEach(function(doc) {
                    // For each doc, add a delete operation to the batch
                    batch.delete(doc.ref);
                });

                // Commit the batch
                return batch.commit();
            }).then(function() {
                // Delete completed!
                // ...
                return document.delete();
            }); 
        })
        .then(() => {
            response.json({ message: 'Delete successfull' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });

        // // First perform the query
};

exports.editProduct = async ( request, response ) => { 

    if(!request.params.productID){
        response.status(403).json({message: 'Not allowed to edit'});
    }

    //check if product not found
    let document = db.collection('products').doc(`${request.params.productID}`);
    document.get()
    .then((doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ error: 'Produk tidak ditemukan' })
        }
    })
    .catch((err) => {
        return response.status(404).json({ error: 'Produk tidak ditemukan' })
    });
    
    //check if product already exixsts
    const productsRef = db.collection('products');
    const product = await productsRef.where('name', '==', request.body.name).limit(1).get();
    if(!product.empty){
        return response.status(400).json({ product: 'Produk ' + request.body.name + ' sudah ada' });
    }


    let updateItem = Object.fromEntries(
        Object.entries(request.body).filter(([key, value]) => value != null && key) 
    );
    
    updateItem.updatedAt = new Date();
    
        
    const searchKeywordsArray = await createSubstringArray(updateItem.name);
    updateItem.searchKeywordsArray = searchKeywordsArray;

    // updateItem.additionalData = fieldValue.arrayRemove('Diameter','Ukuran');
    if(updateItem.deletedAdditionalData){
        updateItem.additionalData = fieldValue.arrayRemove(...updateItem.deletedAdditionalData);
        delete updateItem.deletedAdditionalData;
    }
    if(updateItem.newAdditionalData){
        updateItem.additionalData = fieldValue.arrayUnion(...updateItem.newAdditionalData);
        delete updateItem.newAdditionalData;
    }

    document.update(updateItem)
    .then(()=> {
        response.json({message: 'Updated successfully'});
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ 
                error: err.code 
        });
    });
};