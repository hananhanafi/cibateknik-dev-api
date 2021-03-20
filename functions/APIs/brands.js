const { db } = require('../util/admin');

exports.getAllBrands = (request, response) => {
    
	db
		.collection('brands')
		.orderBy('createdAt', 'desc')
		.get()
		.then((data) => {
			let brands = [];
			data.forEach((doc) => {
				brands.push({
                    brandID: doc.id,
                    name: doc.data().name,
					createdAt: doc.data().createdAt,
					updatedAt: doc.data().updatedAt,
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
        const res = request.body.name.toLowerCase().split(" ");
        const idArr = res.filter(item=>{
            return item!="";
        })

        const id = idArr.join("-");

        const newBrandItem = {
            name: request.body.name,
            createdAt: new Date(),
            updatedAt: new Date(),

        }

        const brandsRef = db.collection('brands');
        const brand = await brandsRef.where('name', '==', newBrandItem.name).limit(1).get();

        if(brand.empty){
            db
            .collection('brands')
            .doc(id)
            .set(newBrandItem)
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
    const document = db.doc(`/brands/${request.params.brandID}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Brand not found' })
            }

            
			if (doc.exists) {
                brandData = doc.data();
                return response.json(brandData);
			}	
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};

exports.deleteBrand = (request, response) => {
    const document = db.doc(`/brands/${request.params.brandID}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Brand not found' })
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

    let updateItem = Object.fromEntries(
        Object.entries(request.body).filter(([key, value]) => value != null) );
    
    updateItem.updatedAt = new Date();
    
    if (request.body.name == undefined || request.body.name.trim() === '') {
        return response.status(400).json({ name: 'Must not be empty' });
    }
    if(!request.params.brandID){
        response.status(403).json({message: 'Not allowed to edit'});
    }
    let document = db.collection('brands').doc(`${request.params.brandID}`);

    document.get()
    .then((doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ error: 'Brand not found' })
        }
    })
    .catch((err) => {
        return response.status(404).json({ error: 'Brand not found' })
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