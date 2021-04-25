const { db } = require('../util/admin');
const { createSubstringArray } = require('../util/helpers');

exports.getAllProducts = async (request, response) => {
    const queryRequest = request.query;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    const search = queryRequest.search;
    const limit = queryRequest.limit ? queryRequest.limit : 10;

    let filterCounter = [];

    if(queryRequest.category){
        filterCounter.push({
            name: 'category',
            value: queryRequest.category
        });
    }
    if(queryRequest.brand){
        filterCounter.push({
            name: 'brand',
            value: queryRequest.brand
        });
    }
    if(queryRequest.supplier){
        filterCounter.push({
            name: 'supplier',
            value: queryRequest.supplier
        });
    }

    //query get all data for counting total data
    let queryGetAll = db.collection('products').orderBy('createdAt', order);
    //query get limited data for pagination
    let queryGetData = db.collection('products')
    .orderBy('createdAt', order)
    .limit(limit);

    if(search){
        if(filterCounter.length > 0){
            if(filterCounter.length==1){
                queryGetAll = db.collection('products')
                .orderBy('createdAt', order)
                .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            }
            else if(filterCounter.length==2){
                queryGetAll = db.collection('products')
                .orderBy('createdAt', order)
                .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            }
            else if(filterCounter.length==3){
                queryGetAll = db.collection('products')
                .orderBy('createdAt', order)
                .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                .where(`${filterCounter[2].name}.id`,'==', filterCounter[2].value)
                .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            }
        }
        else {
            queryGetAll = db.collection('products')
            .orderBy('createdAt', order)
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
        }
    }else{
        if(filterCounter.length > 0){
            if(filterCounter.length==1){
                queryGetAll = db.collection('products')
                .orderBy('createdAt', order)
                .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
            }
            else if(filterCounter.length==2){
                queryGetAll = db.collection('products')
                .orderBy('createdAt', order)
                .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
            }
            else if(filterCounter.length==3){
                queryGetAll = db.collection('products')
                .orderBy('createdAt', order)
                .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                .where(`${filterCounter[2].name}.id`,'==', filterCounter[2].value)
            }
        }
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
            if(filterCounter.length > 0){
                if(filterCounter.length==1){
                    const first = db.collection('products')
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .where("searchKeywordsArray", "array-contains", search.toLowerCase())
                    .orderBy('createdAt', order)
                    .limit((limit*current_page)-limit);
                    const snapshotFirst = await first.get();
                    const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
    
                    queryGetData = db.collection('products')
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .where("searchKeywordsArray", "array-contains", search.toLowerCase())
                    .orderBy('createdAt', order)
                    .startAfter(last.data().createdAt)
                    .limit(limit)
                }
                else if(filterCounter.length==2){
                    const first = db.collection('products')
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                    .where("searchKeywordsArray", "array-contains", search.toLowerCase())
                    .orderBy('createdAt', order)
                    .limit((limit*current_page)-limit);
                    const snapshotFirst = await first.get();
                    const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
    
                    queryGetData = db.collection('products')
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                    .where("searchKeywordsArray", "array-contains", search.toLowerCase())
                    .orderBy('createdAt', order)
                    .startAfter(last.data().createdAt)
                    .limit(limit)
                }
                else if(filterCounter.length==3){
                    const first = db.collection('products')
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                    .where(`${filterCounter[2].name}.id`,'==', filterCounter[2].value)
                    .where("searchKeywordsArray", "array-contains", search.toLowerCase())
                    .orderBy('createdAt', order)
                    .limit((limit*current_page)-limit);
                    const snapshotFirst = await first.get();
                    const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
    
                    queryGetData = db.collection('products')
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                    .where(`${filterCounter[2].name}.id`,'==', filterCounter[2].value)
                    .where("searchKeywordsArray", "array-contains", search.toLowerCase())
                    .orderBy('createdAt', order)
                    .startAfter(last.data().createdAt)
                    .limit(limit)
                }
            }else {
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
            }
        }else{
            if(filterCounter.length > 0){
                if(filterCounter.length==1){
                    queryGetData = db.collection('products')
                    .orderBy('createdAt', order)
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .limit(limit);
                }
                else if(filterCounter.length==2){
                    queryGetData = db.collection('products')
                    .orderBy('createdAt', order)
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                    .limit(limit);
                }
                else if(filterCounter.length==3){
                    queryGetData = db.collection('products')
                    .orderBy('createdAt', order)
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                    .where(`${filterCounter[2].name}.id`,'==', filterCounter[2].value)
                    .limit(limit);
                }
            }else {
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
        }

        const snapshot = await queryGetData.get();
        first_index = ((limit*current_page)-(limit-1));
        last_index = first_index + snapshot.docs.length-1;
    }
    else {
        if(search){
            if(filterCounter.length > 0){
                if(filterCounter.length==1){
                        queryGetData = db.collection('products')
                        .orderBy('createdAt', order)
                        .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                        .where("searchKeywordsArray", "array-contains", search.toLowerCase())
                        .limit(limit);
                }
                else if(filterCounter.length==2){
                    queryGetData = db.collection('products')
                    .orderBy('createdAt', order)
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                    .where("searchKeywordsArray", "array-contains", search.toLowerCase())
                    .limit(limit);
                }
                else if(filterCounter.length==3){
                    queryGetData = db.collection('products')
                    .orderBy('createdAt', order)
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                    .where(`${filterCounter[2].name}.id`,'==', filterCounter[2].value)
                    .where("searchKeywordsArray", "array-contains", search.toLowerCase())
                    .limit(limit);
                }
            }else {
                queryGetData = db.collection('products')
                .orderBy('createdAt', order)
                .where("searchKeywordsArray", "array-contains", search.toLowerCase())
                .limit(limit);
            }
        }else{
            if(filterCounter.length > 0){
                if(filterCounter.length==1){
                    queryGetData = db.collection('products')
                    .orderBy('createdAt', order)
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .limit(limit);
                }
                else if(filterCounter.length==2){
                    queryGetData = db.collection('products')
                    .orderBy('createdAt', order)
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                    .limit(limit);
                }
                else if(filterCounter.length==3){
                    queryGetData = db.collection('products')
                    .orderBy('createdAt', order)
                    .where(`${filterCounter[0].name}.id`,'==', filterCounter[0].value)
                    .where(`${filterCounter[1].name}.id`,'==', filterCounter[1].value)
                    .where(`${filterCounter[2].name}.id`,'==', filterCounter[2].value)
                    .limit(limit);
                }
            }
        }
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
                productUID: doc.data().productUID,
                name: doc.data().name,
                category: doc.data().category,
                brand: doc.data().brand,
                supplier: doc.data().supplier,
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
        
        const res = request.body.name.toLowerCase().split(" ");
        const nameArr = res.filter(item=>{
            return item!="";
        })
        const productUID = nameArr.join("-");


        const newProductItem = {
            productUID: productUID,
            name: request.body.name ? request.body.name : null,
            category: request.body.category ? request.body.category : null,
            supplier: request.body.supplier ? request.body.supplier : null,
            brand: request.body.brand ? request.body.brand : null,
            additionalData: request.body.additionalData ? request.body.additionalData : [],
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        
        
        const searchKeywordsArray = await createSubstringArray(newProductItem.name);
        newProductItem.searchKeywordsArray = searchKeywordsArray;

        
        const productsRef = db.collection('products');
        const product = await productsRef.where('name', '==', newProductItem.name).limit(1).get();

        if(product.empty){
            db
            .collection('products')
            // .doc(productUID)
            .add(newProductItem)
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
            return response.status(404).json({ message: 'Produk tidak ditemukan' })
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
                return response.status(404).json({ message: 'Produk tidak ditemukan' })
            }else {
                
                db.collection('items_posted').where('productID','==',productID).get()
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
            }
        })
        .then(() => {
            response.json({ message: 'Delete successfull' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};

exports.editProduct = async ( request, response ) => { 
    if(!request.params.productID){
        response.status(403).json({message: 'Not allowed to edit'});
    }

    //check if product not found
    let document = db.collection('products').doc(`${request.params.productID}`);
    await document.get()
    .then(async(doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ message: 'Produk tidak ditemukan' })
        }

        if(doc.data().name!=request.body.name){
            //check if product already exixsts
            const productsRef = db.collection('products');
            const product = await productsRef.where('name', '==', request.body.name).limit(1).get();
            if(!product.empty){
                return response.status(400).json({ product: 'Produk ' + request.body.name + ' sudah ada' });
            }

        }
    })
    .catch((err) => {
        return response.status(404).json({ message: 'Produk tidak ditemukan' })
    });

    let updateItem = Object.fromEntries(
        Object.entries(request.body).filter(([key, value]) => value != null && key) 
    );
    
    const res = request.body.name.toLowerCase().split(" ");
    const nameArr = res.filter(item=>{
        return item!="";
    });

    const productUID = nameArr.join("-");

    updateItem.productUID = productUID;    
    updateItem.updatedAt = new Date();
    
    const searchKeywordsArray = await createSubstringArray(updateItem.name);
    updateItem.searchKeywordsArray = searchKeywordsArray;

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