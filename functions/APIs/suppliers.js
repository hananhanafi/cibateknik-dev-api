const { db } = require('../util/admin');

exports.getAllSuppliers = (request, response) => {
    
	db
		.collection('suppliers')
		.orderBy('createdAt', 'desc')
		.get()
		.then((data) => {
			let suppliers = [];
			data.forEach((doc) => {
				suppliers.push({
                    supplierId: doc.id,
                    name: doc.data().name,
                    address: doc.data().address,
					createdAt: doc.data().createdAt,
				});
			});
			return response.json(suppliers);
		})
		.catch((err) => {
			console.error(err);
			return response.status(500).json({ error: err});
		});
};

exports.postOneSupplier = async (request, response) => {

    try {
        
        if (request.body.name == undefined || request.body.name.trim() === '') {
            return response.status(400).json({ name: 'Must not be empty' });
        }
        
        const newSupplier = {
            name: request.body.name,
            address: request.body.address,
            createdAt: new Date().toISOString()
        }

        const res = request.body.name.toLowerCase().split(" ");
        const idArr = res.filter(item=>{
            return item!="";
        })

        const id = idArr.join("-");

        const suppliersRef = db.collection('suppliers');
        const supplier = await suppliersRef.where('name', '==', newSupplier.name).limit(1).get();

        if(supplier.empty){
            db
            .collection('suppliers')
            .doc(id)
            .set(newSupplier)
            .then((doc)=>{
                const responseSupplier = newSupplier;
                responseSupplier.id = doc.id;
                return response.json(responseSupplier);
            })
            .catch((err) => {
                response.status(500).json({ error: 'Something went wrong' });
                console.error(err);
            });

        }else{
            return response.status(400).json({ supplier: 'Supplier already exists' });
        }
        
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
};

exports.getOneSupplier = (request, response) => {
    const document = db.doc(`/suppliers/${request.params.supplierId}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Supplier not found' })
            }

            
			if (doc.exists) {
                supplierData = doc.data();
                return response.json(supplierData);
			}	
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};

exports.deleteSupplier = (request, response) => {
    const document = db.doc(`/suppliers/${request.params.supplierId}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Supplier not found' })
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

exports.editSupplier = ( request, response ) => { 
    
    if (request.body.name == undefined || request.body.name.trim() === '') {
        return response.status(400).json({ name: 'Must not be empty' });
    }
    if(!request.params.supplierId){
        response.status(403).json({message: 'Not allowed to edit'});
    }
    let document = db.collection('suppliers').doc(`${request.params.supplierId}`);

    document.get()
    .then((doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ error: 'Supplier not found' })
        }
    })
    .catch((err) => {
        return response.status(404).json({ error: 'Supplier not found' })
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