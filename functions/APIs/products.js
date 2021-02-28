const { db } = require('../util/admin');

exports.getAllProducts = (request, response) => {
    
	db
		.collection('products')
		.orderBy('createdAt', 'desc')
		.get()
		.then((data) => {
			let products = [];
			data.forEach((doc) => {
				products.push({
                    productId: doc.id,
                    name: doc.data().name,
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
            name: request.body.name,
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
            return response.status(400).json({ product: 'Product already exists' });
        }
        
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
};

exports.getOneProduct = (request, response) => {
    const document = db.doc(`/products/${request.params.productId}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Product not found' })
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
    const document = db.doc(`/products/${request.params.productId}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Product not found' })
            }
            return document.delete();
        })
        .then(() => {
            response.json({ message: 'Delete successfull' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};

exports.editProduct = ( request, response ) => { 

    let updateItem = Object.fromEntries(
        Object.entries(request.body).filter(([key, value]) => value != null) );
    
    updateItem.updatedAt = new Date();

    if(!request.params.productId){
        response.status(403).json({message: 'Not allowed to edit'});
    }
    let document = db.collection('products').doc(`${request.params.productId}`);

    document.get()
    .then((doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ error: 'Product not found' })
        }
    })
    .catch((err) => {
        return response.status(404).json({ error: 'Product not found' })
    });

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