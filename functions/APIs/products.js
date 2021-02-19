const { db } = require('../util/admin');

exports.getAllProducts = (request, response) => {
    
	db
		.collection('products')
        .where('username_admin', '==', request.user.username)
		.orderBy('createdAt', 'desc')
		.get()
		.then((data) => {
			let products = [];
			data.forEach((doc) => {
				products.push({
                    productId: doc.id,
                    name: doc.data().name,
					createdAt: doc.data().createdAt,
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
            username_admin: request.user.username,
            name: request.body.name,
            createdAt: new Date().toISOString()
        }

        const productsRef = db.collection('products');
        const product = await productsRef.where('name', '==', newProductItem.name).limit(1).get();

        if(product.empty){
            db
            .collection('products')
            .add(newProductItem)
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
            if(doc.data().username_admin !== request.user.username){
                return response.status(403).json({error:"UnAuthorized"})
            }

            
			if (doc.exists) {
                todoData = doc.data();
                return response.json(todoData);
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
            if(doc.data().username_admin !== request.user.username){
                return response.status(403).json({error:"UnAuthorized"})
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
    
    if (request.body.name == undefined || request.body.name.trim() === '') {
        return response.status(400).json({ name: 'Must not be empty' });
    }
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

    document.update(request.body)
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