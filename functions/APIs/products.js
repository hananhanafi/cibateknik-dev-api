const { db, fieldValue } = require('../util/admin');

exports.getAllProducts = (request, response) => {
	db
    .collection('products')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
        let products = [];
        data.forEach((doc) => {
            products.push({
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
        const idArr = res.filter(item=>{
            return item!="";
        })

        const id = idArr.join("-");
        
        const productsRef = db.collection('products');
        const product = await productsRef.where('name', '==', newProductItem.name).limit(1).get();

        if(product.empty){
            db
            .collection('products')
            .doc(id)
            .set(newProductItem)
            .then((doc)=>{
                const responseProductItem = newProductItem;
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
    
    // updateItem.additionalData = fieldValue.arrayRemove('Diameter','Ukuran');
    if(updateItemdeletedAdditionalData){
        updateItem.additionalData = fieldValue.arrayRemove(...updateItemdeletedAdditionalData);
        delete updateItemdeletedAdditionalData;
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