const { db } = require('../util/admin');
const { createSubstringArray } = require('../util/helpers');
const { validateEmptyData } = require('../util/validators');

// exports.getAllSuppliers = (request, response) => {
    
// 	db
// 		.collection('suppliers')
// 		.orderBy('createdAt', 'desc')
// 		.get()
// 		.then((data) => {
// 			let suppliers = [];
// 			data.forEach((doc) => {
// 				suppliers.push({
//                     supplierID: doc.id,
//                     name: doc.data().name,
//                     address: doc.data().address,
// 					createdAt: doc.data().createdAt,
// 					updatedat: doc.data().updatedat,
// 				});
// 			});
// 			return response.json(suppliers);
// 		})
// 		.catch((err) => {
// 			console.error(err);
// 			return response.status(500).json({ error: err});
// 		});
// };

exports.getAllSuppliers = async (request, response) => {
    const queryRequest = request.query;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    const search = queryRequest.search;
    const limit = queryRequest.limit ? queryRequest.limit : 10;

    //query get all data for counting total data
    let queryGetAll = db.collection('suppliers').orderBy('createdAt', order);
    
    //query get limited data for pagination
    let queryGetData = db.collection('suppliers')
    .orderBy('createdAt', order)
    .limit(limit);
    
    if(search){
        queryGetAll = db.collection('suppliers')
        .orderBy('createdAt', order)
        .where("searchKeywordsArray", "array-contains", search.toLowerCase())

        queryGetData = db.collection('suppliers')
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
            const first = db.collection('suppliers')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];

            queryGetData = db.collection('suppliers')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .startAfter(last.data().createdAt)
            .limit(limit)
        }else{
            const first = db.collection('suppliers')
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
            
            queryGetData = db.collection('suppliers')
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
        let suppliers = {
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
            suppliers.data.push({
                supplierID: doc.id,
                supplierUID: doc.data().supplierUID,
                name: doc.data().name,
                address: doc.data().address,
                createdAt: doc.data().createdAt,
                updatedAt: doc.data().updatedAt,
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
        const newSupplier = {
            name: request.body.name,
            address: request.body.address,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        //check if new item valid
        const { valid, errors } = validateEmptyData(newSupplier);
        if (!valid) return response.status(400).json(errors);
        
        const res = request.body.name.toLowerCase().split(" ");
        const nameArr = res.filter(item=>{
            return item!="";
        })

        const supplierUID = nameArr.join("-");
        newSupplier.supplierUID = supplierUID;
        
        const searchKeywordsArray = await createSubstringArray(newSupplier.name);
        newSupplier.searchKeywordsArray = searchKeywordsArray;

        const suppliersRef = db.collection('suppliers');
        const supplier = await suppliersRef.where('name', '==', newSupplier.name).limit(1).get();

        if(supplier.empty){
            db
            .collection('suppliers')
            .add(newSupplier)
            .then((doc)=>{
                const responseSupplier = newSupplier;
                delete responseSupplier.searchKeywordsArray;
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
    const document = db.doc(`/suppliers/${request.params.supplierID}`);
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
    const document = db.doc(`/suppliers/${request.params.supplierID}`);
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

exports.editSupplier = async ( request, response ) => { 

    let updateSupplier = Object.fromEntries(
        Object.entries(request.body).filter(([key, value]) => value != null) );
    
    updateSupplier.updatedAt = new Date();
    
    if(!request.params.supplierID){
        response.status(403).json({message: 'Not allowed to edit'});
    }
    let document = db.collection('suppliers').doc(`${request.params.supplierID}`);

    document.get()
    .then(async (doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ error: 'Supplier not found' })
        }
        
        if(doc.data().name!=request.body.name){
            //check if supplier already exixsts
            const suppliersRef = db.collection('suppliers');
            const supplier = await suppliersRef.where('name', '==', request.body.name).limit(1).get();
            if(!supplier.empty){
                return response.status(400).json({ supplier: 'Supplier ' + request.body.name + ' sudah ada' });
            }
        }
    })
    .catch((err) => {
        return response.status(404).json({ error: 'Supplier not found' })
    });

    
    const res = request.body.name.toLowerCase().split(" ");
    const nameArr = res.filter(item=>{
        return item!="";
    })
    const supplierUID = nameArr.join("-");

    updateSupplier.supplierUID = supplierUID;    
    updateSupplier.updatedAt = new Date();
    
    const searchKeywordsArray = await createSubstringArray(updateSupplier.name);
    updateSupplier.searchKeywordsArray = searchKeywordsArray;

    document.update(updateSupplier)
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