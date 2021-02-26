const { db } = require('../util/admin');
const { validateEmptyData } = require('../util/validators');

exports.getAllItems = async (request, response) => {
    
    let items = [];
	await db
		.collection('items')
		.orderBy('createdAt', 'desc')
		.get()
		.then((data) => {
			data.forEach((doc) => {
                let currentID = doc.id
                let appObj = { ...doc.data(), ['id']: currentID }
                
                items.push(appObj)
			});
		})
		.catch((err) => {
			console.error(err);
			return response.status(500).json({ error: err});
		});

        
        return response.json({items,message: 'Succed'});
};



exports.getOneItem = (request, response) => {
    const document = db.doc(`/items/${request.params.itemId}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Item not found' })
            }
            
			if (doc.exists) {
                id = doc.id;
                itemData = {...doc.data(),id};
                return response.json(itemData);

			}	
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};


// async function getDescriptionItem(doc){
//     const collectionRef = db.collection('items');
//     let subCollectionDocs = await collectionRef.doc(doc.id).collection("description").get();

//     let item = {};
//     await subCollectionDocs.forEach(subCollectionDoc => {
//         console.log("subcollectiondocs: ", subCollectionDoc.id);
//         let currentID = subCollectionDoc.id
//         let appObj = { ...subCollectionDoc.data(), ['id']: currentID }
        
//         item = (appObj)
        
//     });

//     return item;
// }



// exports.getItemDescriptions = async (request, response) => {
    
//     let items = [];
// 	await db
// 		.collection('items')
// 		.orderBy('createdAt', 'desc')
// 		.get()
// 		.then((data) => {
// 			data.forEach((doc) => {
//                 let currentID = doc.id
//                 let appObj = { ...doc.data(), ['id']: currentID }
                
//                 items.push(appObj)
// 			});
// 		})
// 		.catch((err) => {
// 			console.error(err);
// 			return response.status(500).json({ error: err});
// 		});

        
//         return response.json({items,message: 'Succed'});
// };

// exports.getAllItems = async (request, response) => {
//     // Get reference to all of the documents
//     console.log("Retrieving list of documents in collection");

//     const collectionRef = db.collection('items');
//     let documents = await collectionRef.get();

//     try{

//         var p1 = new Promise (
//             async function (resolve,reject){
//                 let appObj = [];
//                 documents.forEach(async doc => {

//                     let currentID = doc.id

//                     let sub = await getSub(doc)
//                     .then((data)=>{
//                         console.log("getsubdata",data);
                        
//                         appObj = { ...doc.data(), ['id']: currentID }
//                     })
                    
//                     console.log("Parent Document ID: ", doc.id);
        
                    
//                 })

//                 console.log("resolve");
//                 resolve(appObj);

//             }
//         )

//         await p1.then((data)=>{
//             console.log("p1",data)
//         })
//         console.log("ww");
//         // })
    
//     }catch(err){
//         console.log(err);
//     }

//     console.log("Done");
        
// };

exports.postOneItem = async (request, response) => {

    try {
        
        
        const newItem = {
            productId: request.body.productId,
            brandId: request.body.brandId,
            supplierId: request.body.supplierId,
            name: request.body.name,
            stock: request.body.stock,
            minimumStock: request.body.minimumStock,
            price: request.body.price,
            createdAt: new Date().toISOString(),
            descriptions: request.body.descriptions
        }

        
        
        const { valid, errors } = validateEmptyData(newItem);
        if (!valid) return response.status(400).json(errors);

        
        const res = request.body.name.toLowerCase().split(" ");
        const idArr = res.filter(item=>{
            return item!="";
        })

        const id = idArr.join("-");

        await db.doc(`/products/${newItem.productId}`)
        .get()
        .then((doc)=>{
            if(!doc.exists){
                return response.status(404).json({ error: 'Product not found' })
            }
        })

        await db.doc(`/brands/${newItem.brandId}`)
        .get()
        .then((doc)=>{
            if(!doc.exists){
                return response.status(404).json({ error: 'Brand not found' })
            }
        })
        
        await db.doc(`/suppliers/${newItem.supplierId}`)
        .get()
        .then((doc)=>{
            if(!doc.exists){
                return response.status(404).json({ error: 'Supplier not found' })
            }
        })

        db
        .collection('items')
        .doc(id)
        .set(newItem)
        .then((doc)=>{
            const responseItem = newItem;
            responseItem.id = doc.id;
            return response.json(responseItem);
        })
        .catch((err) => {
			response.status(500).json({ error: 'Something went wrong' });
			console.error(err);
		});

        
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
};

exports.deleteItem = (request, response) => {
    const document = db.doc(`/items/${request.params.itemId}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Item not found' })
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

exports.editItem = ( request, response ) => { 
    console.log("bdy",request.body);
    // const obj2 = Object.map(obj1, (k,v) => v + 5);
    // var filtered = Object.filter(scores, score => score > 1); 
    const updateItem = Object.fromEntries(
        Object.entries(request.body).filter(([key, value]) => value != null) )

    if (request.body.name == undefined || request.body.name.trim() === '') {
        return response.status(400).json({ name: 'Must not be empty' });
    }
    if(!request.params.itemId){
        response.status(403).json({message: 'Not allowed to edit'});
    }
    let document = db.collection('items').doc(`${request.params.itemId}`);

    document.get()
    .then((doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ error: 'Item not found' })
        }
    })
    .catch((err) => {
        return response.status(404).json({ error: 'Item not found' })
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