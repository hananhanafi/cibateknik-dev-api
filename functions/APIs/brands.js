const { db } = require('../util/admin');
const { createSubstringArray } = require('../util/helpers');

// exports.getAllBrands = (request, response) => {
    
// 	db
// 		.collection('brands')
// 		.orderBy('createdAt', 'desc')
// 		.get()
// 		.then((data) => {
// 			let brands = [];
// 			data.forEach((doc) => {
// 				brands.push({
//                     brandID: doc.id,
//                     name: doc.data().name,
// 					createdAt: doc.data().createdAt,
// 					updatedAt: doc.data().updatedAt,
// 				});
// 			});
// 			return response.json(brands);
// 		})
// 		.catch((err) => {
// 			console.error(err);
// 			return response.status(500).json({ error: err});
// 		});
// };

exports.getAllBrands= async (request, response) => {
    const queryRequest = request.query;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    const search = queryRequest.search;
    const limit = queryRequest.limit ? queryRequest.limit : 10;

    //query get all data for counting total data
    let queryGetAll = db.collection('brands').orderBy('createdAt', order);
    
    //query get limited data for pagination
    let queryGetData = db.collection('brands')
    .orderBy('createdAt', order)
    .limit(limit);
    
    if(search){
        queryGetAll = db.collection('brands')
        .orderBy('createdAt', order)
        .where("searchKeywordsArray", "array-contains", search.toLowerCase())

        queryGetData = db.collection('brands')
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
            const first = db.collection('brands')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];

            queryGetData = db.collection('brands')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .startAfter(last.data().createdAt)
            .limit(limit)
        }else{
            const first = db.collection('brands')
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
            
            queryGetData = db.collection('brands')
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
        let brands = {
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
            brands.data.push({
                brandID: doc.id,
                brandUID: doc.data().brandUID,
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
        const nameArr = res.filter(item=>{
            return item!="";
        })

        const brandUID = nameArr.join("-");

        const newBrandItem = {
            brandUID: brandUID,
            name: request.body.name,
            createdAt: new Date(),
            updatedAt: new Date(),

        }
        
        const searchKeywordsArray = await createSubstringArray(newBrandItem.name);
        newBrandItem.searchKeywordsArray = searchKeywordsArray;

        const brandsRef = db.collection('brands');
        const brand = await brandsRef.where('name', '==', newBrandItem.name).limit(1).get();

        if(brand.empty){
            db
            .collection('brands')
            .add(newBrandItem)
            .then((doc)=>{
                const responseBrandItem = newBrandItem;
                delete responseBrandItem.searchKeywordsArray;
                responseBrandItem.id = doc.id;
                return response.json(responseBrandItem);
            })
            .catch((err) => {
                response.status(500).json({ message: 'Something went wrong' });
                console.error(err);
            });

        }else{
            return response.status(400).json({ message: 'Brand already exists' });
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
                return response.status(404).json({ message: 'Brand not found' })
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
                return response.status(404).json({ message: 'Brand not found' })
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

exports.editBrand = async ( request, response ) => { 

    if (request.body.name == undefined || request.body.name.trim() === '') {
        return response.status(400).json({ name: 'Must not be empty' });
    }
    if(!request.params.brandID){
        response.status(403).json({message: 'Not allowed to edit'});
    }

    let updateBrand = Object.fromEntries(
        Object.entries(request.body).filter(([key, value]) => value != null) );
    
    updateBrand.updatedAt = new Date();
    let document = db.collection('brands').doc(`${request.params.brandID}`);

    document.get()
    .then(async (doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ message: 'Brand not found' })
        }
        
        if(doc.data().name!=request.body.name){
            //check if brand already exixsts
            const brandsRef = db.collection('brands');
            const brand = await brandsRef.where('name', '==', request.body.name).limit(1).get();
            if(!brand.empty){
                return response.status(400).json({ brand: 'Brand/Merk ' + request.body.name + ' sudah ada' });
            }
        }
    })
    .catch((err) => {
        return response.status(404).json({ message: 'Brand not found' })
    });

    const res = request.body.name.toLowerCase().split(" ");
    const nameArr = res.filter(item=>{
        return item!="";
    })
    const brandUID = nameArr.join("-");

    updateBrand.brandUID = brandUID;    
    updateBrand.updatedAt = new Date();
    
    const searchKeywordsArray = await createSubstringArray(updateBrand.name);
    updateBrand.searchKeywordsArray = searchKeywordsArray;

    document.update(updateBrand)
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