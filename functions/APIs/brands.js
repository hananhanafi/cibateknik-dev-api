const { db } = require('../util/admin');

exports.getAllBrands = (request, response) => {
    
	db
		.collection('brands')
        .where('username_admin', '==', request.user.username)
		.orderBy('createdAt', 'desc')
		.get()
		.then((data) => {
			let brands = [];
			data.forEach((doc) => {
				brands.push({
                    brandId: doc.id,
                    name: doc.data().name,
					createdAt: doc.data().createdAt,
				});
			});
			return response.json(brands);
		})
		.catch((err) => {
			console.error(err);
			return response.status(500).json({ error: err});
		});
};

exports.postOneBrand = async (request, response) => {

    try {
        
        if (request.body.name == undefined || request.body.name.trim() === '') {
            return response.status(400).json({ name: 'Must not be empty' });
        }
        
        const newBrandItem = {
            username_admin: request.user.username,
            name: request.body.name,
            createdAt: new Date().toISOString()
        }

        const brandsRef = db.collection('brands');
        const brand = await brandsRef.where('name', '==', newBrandItem.name).limit(1).get();

        if(brand.empty){
            db
            .collection('brands')
            .add(newBrandItem)
            .then((doc)=>{
                const responseBrandItem = newBrandItem;
                responseBrandItem.id = doc.id;
                return response.json(responseBrandItem);
            })
            .catch((err) => {
                response.status(500).json({ error: 'Something went wrong' });
                console.error(err);
            });

        }else{
            return response.status(400).json({ brand: 'Brand already exists' });
        }
        
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
};

exports.getOneBrand = (request, response) => {
    const document = db.doc(`/brands/${request.params.brandId}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Brand not found' })
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

exports.deleteBrand = (request, response) => {
    const document = db.doc(`/brands/${request.params.brandId}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Brand not found' })
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

exports.editBrand = ( request, response ) => { 
    
    if (request.body.name == undefined || request.body.name.trim() === '') {
        return response.status(400).json({ name: 'Must not be empty' });
    }
    if(!request.params.brandId){
        response.status(403).json({message: 'Not allowed to edit'});
    }
    let document = db.collection('brands').doc(`${request.params.brandId}`);

    document.get()
    .then((doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ error: 'Brand not found' })
        }
    })
    .catch((err) => {
        return response.status(404).json({ error: 'Brand not found' })
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