const { db } = require('../util/admin');
const { validateEmptyData } = require('../util/validators');
const { monthNames } = require('../util/constants');

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
    const document = db.doc(`/items/${request.params.itemID}`);
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

exports.postOneItem = async (request, response) => {

    try {

        const date = new Date();
        
        const ids = {
            productID: request.body.productID,
            brandID: request.body.brandID,
            supplierID: request.body.supplierID,
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
            additionalData: request.body.additionalData
        }

        
        //check if new item valid
        const { valid, errors } = validateEmptyData(newItem);
        if (!valid) return response.status(400).json(errors);

        await db.doc(`/products/${newItem.productID}`)
        .get()
        .then((doc)=>{
            if(!doc.exists){
                return response.status(404).json({ error: 'Product not found' })
            }
        })

        await db.doc(`/brands/${newItem.brandID}`)
        .get()
        .then((doc)=>{
            if(!doc.exists){
                return response.status(404).json({ error: 'Brand not found' })
            }
        })
        
        await db.doc(`/suppliers/${newItem.supplierID}`)
        .get()
        .then((doc)=>{
            if(!doc.exists){
                return response.status(404).json({ error: 'Supplier not found' })
            }
        })
        //end check if new item valid
        
        
        const res = request.body.name.toLowerCase().split(" ");
        const itemIDArr = res.filter(item=>{
            return item!="";
        })

        const itemID = itemIDArr.join("-");

        //check if item alread exists
        await db.doc(`/items/${itemID}`)
        .get()
        .then((doc)=>{
            if(doc.exists){
                return response.status(404).json({ error: 'Item already exists' })
            }
        })
        

        const newMonthlyItem = {
            ...ids,
            itemID : itemID,
            startStock : newItem.stock,
            endStock: newItem.stock,
            year: date.getFullYear(),
            month: monthNames[date.getMonth()],
            createdAt: date,
            updatedAt: date,
        }

        const newDailyItem = {
            ...ids,
            itemID : itemID,
            in : newItem.stock,
            out : 0,
            year : date.getFullYear(),
            month : monthNames[date.getMonth()],
            date : date.getDate(),
            createdAt: date,
            updatedAt: date,
        }
        
        //create item monthly and daily stock id
        itemMonthlyId = itemID + "_" + newMonthlyItem.year + "_" + newMonthlyItem.month;
        itemDailyId = itemID + "_" + date.toISOString();

        db
        .collection('items')
        .doc(itemID)
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
    const document = db.doc(`/items/${request.params.itemID}`);
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
    if(!request.params.itemID){
        response.status(403).json({message: 'Not allowed to edit'});
    }
    let document = db.collection('items').doc(`${request.params.itemID}`);

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
            let itemID = "";

            await db
            .doc(`/items/${item}`).get().then((doc)=>{
                if (!doc.exists) {
                    return response.status(404).json({ item: 'Item not found' })
                }else{
                    itemID = doc.id;
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
            .doc(itemID)
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


exports.updateSoldItem = async (request, response) => {
    try {
        
        const items_id = request.body.items_id;

        await items_id.forEach(async item => {
            let itemData = {};
            let itemID = "";

            await db
            .doc(`/items/${item}`).get().then((doc)=>{
                if (!doc.exists) {
                    return response.status(404).json({ item: 'Item not found' })
                }else{
                    itemID = doc.id;
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
            .collection('items_sold')
            .doc(itemID)
            .set(itemData)
            .then(()=>{
                //success add item Sold
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

    return response.status(200).json({"message":"Berhasil sold item"});
};


exports.deleteSoldItem = async (request, response) => {
    try {
        
        const items_id = request.body.items_id;

        await items_id.forEach(async item => {
            const document = db.doc(`/items_sold/${item}`);
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


    return response.status(200).json({"message":"Berhasil menghapus sold item"});
};




