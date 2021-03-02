const { db } = require('../util/admin');
const { validateEmptyData } = require('../util/validators');
const { monthNames, dayNames } = require('../util/constants');

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

        const date = new Date();
        
        const ids = {
            productId: request.body.productId,
            brandId: request.body.brandId,
            supplierId: request.body.supplierId,
        }
        
        const newItem = {
            ...ids,
            name: request.body.name,
            stock: request.body.stock,
            minimumStock: request.body.minimumStock,
            price: request.body.price,
            note: request.body.note,
            createdAt: date,
            updatedAt: date,
            descriptions: request.body.descriptions
        }

        
        //check if new item valid
        const { valid, errors } = validateEmptyData(newItem);
        if (!valid) return response.status(400).json(errors);

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
        //end check if new item valid
        
        
        const res = request.body.name.toLowerCase().split(" ");
        const itemIdArr = res.filter(item=>{
            return item!="";
        })

        const itemId = itemIdArr.join("-");

        //check if item alread exists
        await db.doc(`/items/${itemId}`)
        .get()
        .then((doc)=>{
            if(doc.exists){
                return response.status(404).json({ error: 'Item already exists' })
            }
        })
        

        const newMonthlyItem = {
            ...ids,
            itemId : itemId,
            startStock : newItem.stock,
            endStock: newItem.stock,
            year: date.getFullYear(),
            month: monthNames[date.getMonth()],
            createdAt: date,
            updatedAt: date,
        }

        const newDailyItem = {
            ...ids,
            itemId : itemId,
            in : newItem.stock,
            out : 0,
            year : date.getFullYear(),
            month : monthNames[date.getMonth()],
            date : date.getDate(),
            createdAt: date,
            updatedAt: date,
        }
        
        //create item monthly and daily stock id
        itemMonthlyId = itemId + "_" + newMonthlyItem.year + "_" + newMonthlyItem.month;
        itemDailyId = itemId + "_" + date.toISOString();

        db
        .collection('items')
        .doc(itemId)
        .set(newItem)
        .then((doc)=>{
            const responseItem = newItem;
            responseItem.id = doc.id;
            return responseItem;
        })
        .then(async (responseItem)=>{
            
            await db.collection('items_monthly_stock').doc(itemMonthlyId)
            .set(newMonthlyItem)
            .then((doc)=>{
                responseItem.monthlyStock = {id:doc.id,...newMonthlyItem};
            })
            .catch((err) => {
                response.status(500).json({ error: err });
                console.error(err);
            });

            await db.collection('items_daily_stock').doc(itemDailyId)
            .set(newDailyItem)
            .then((doc)=>{
                responseItem.dailyStock =  {id:doc.id,...newDailyItem};
            })
            .catch((err) => {
                response.status(500).json({ error: err });
                console.error(err);
            });

            return response.json(responseItem);


        })
        .catch((err) => {
			response.status(500).json({ error: err });
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
    // const obj2 = Object.map(obj1, (k,v) => v + 5);
    // var filtered = Object.filter(scores, score => score > 1); 
    let updateItem = Object.fromEntries(
        Object.entries(request.body).filter(([key, value]) => value != null) );
    
    updateItem.updatedAt = new Date();

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


exports.updatePostedItem = async (request, response) => {
    try {
        
        const items_id = request.body.items_id;

        await items_id.forEach(async item => {
            let itemData = {};
            let itemId = "";

            await db
            .doc(`/items/${item}`).get().then((doc)=>{
                if (!doc.exists) {
                    return response.status(404).json({ item: 'Item not found' })
                }else{
                    itemId = doc.id;
                    itemData = doc.data();
                    itemData.createdAt = new Date();
                    itemData.updatedAt = new Date();
                }
                
            })
            .catch (error => {
                console.error(error);
                return response.status(500).json({ error: error });
            })

            
            await db
            .collection('items_posted')
            .doc(itemId)
            .set(itemData)
            .then(()=>{
                //success add item posted
            })
            .catch (error => {
                console.error(error);
                return response.status(500).json({ error: error });
            })

            
        })
        
    } 
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }

    return response.status(200).json({"message":"Berhasil menambahkan item pada katalog"});
};


exports.deletePostedItem = async (request, response) => {
    try {
        
        const items_id = request.body.items_id;

        await items_id.forEach(async item => {
            const document = db.doc(`/items_posted/${item}`);
            await document
                .get()
                .then((doc) => {
                    if (!doc.exists) {
                        return response.status(404).json({ error: 'Item not found' })
                    }
                    document.delete();
                })
                .catch((err) => {
                    console.error(err);
                    return response.status(500).json({ error: err.code });
                });
        })
        
    } 
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }


    return response.status(200).json({"message":"Berhasil menghapus item"});
};



