const { admin,db, fieldValue } = require('../util/admin');
const config = require('../util/config');
const { validateEmptyData } = require('../util/validators');
const { monthNames } = require('../util/constants');
const { createSubstringArray } = require('../util/helpers');

exports.getAllDataItems = async (request, response) => {
    const docRef = db.collection('products').doc(request.params.productID);
    let items = []
    await docRef.collection('items')
    .get()
    .then((data) => {
        data.forEach((doc) => {
            const data = doc.data();
            delete data.searchKeywordsArray;
            let currentID = doc.id
            let appObj = { ...data, ['id']: currentID }
            
            items.push(appObj)
        });
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });

    return response.json({data:items,message: 'Succed'});
}

exports.getAllItemsByProduct = async (request, response) => {
    const requestQuery = request.query;
    
    if (requestQuery.month == undefined || requestQuery.month.trim() === '') {
        return response.status(400).json({ month: 'Must not be empty' });
    }
    if (requestQuery.year == undefined || requestQuery.year.trim() === '') {
        return response.status(400).json({ year: 'Must not be empty' });
    }
    const month = parseInt(requestQuery.month);
    const year = parseInt(requestQuery.year);
    const search = requestQuery.search || '';
    const order = requestQuery.order ? (requestQuery.order == 'asc' ? 'asc' : 'desc') : null;
    let items = {
        product:null,
        items:[],
        items_monthly_stock: [],
        items_daily_stock: [],
    };

    const docRef = db.collection('products').doc(request.params.productID)

    await docRef.get()
    .then(doc=>{
        const data = doc.data();
        delete data.searchKeywordsArray;
        items.product = data;
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });

    try {
        if(search){
            await db.collection('products').doc(request.params.productID).collection('items')
            .orderBy(order ? 'createdAt' : 'name', order ? order : 'asc')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .get()
            .then((data) => {
                data.forEach((doc) => {
                    const data = doc.data();
                    delete data.searchKeywordsArray;
                    let currentID = doc.id
                    let appObj = { ...data, ['id']: currentID }
                    
                    items.items.push(appObj)
                });
            })
            .catch((err) => {
                console.error(err);
                return response.status(500).json({ error: err});
            });

        }else {
            await docRef.collection('items')
            .orderBy(order ? 'createdAt' : 'name', order ? order : 'asc')
            .get()
            .then((data) => {
                data.forEach((doc) => {
                    const data = doc.data();
                    delete data.searchKeywordsArray;
                    let currentID = doc.id
                    let appObj = { ...data, ['id']: currentID }
                    
                    items.items.push(appObj)
                });
            })
            .catch((err) => {
                console.error(err);
                return response.status(500).json({ error: err});
            });
        }
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }

    await docRef.collection('items_monthly_stock')
    .where('month','==',month)
    .where('year','==',year)
    .get()
    .then((data) => {
        data.forEach((doc) => {
            const data = doc.data();
            let currentID = doc.id
            let appObj = { ...data, ['id']: currentID }
            
            items.items_monthly_stock.push(appObj)
        });
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
    
    await docRef.collection('items_daily_stock')
    .where('month','==',month)
    .where('year','==',year)
    .get()
    .then((data) => {
        data.forEach((doc) => {
            const data = doc.data();
            let currentID = doc.id;
            let appObj = { ...data, ['id']: currentID };
            
            items.items_daily_stock.push(appObj);
        });
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
        
    return response.json({data:items,message: 'Succed'});
};

exports.getOneItem = async (request, response) => {
    let itemData = {
        product: null,
        item: null,
    };
    const docRef = db.collection('products').doc(request.params.productID);
    await docRef.get()
    .then(doc=>{
        const data = doc.data();
        delete data.searchKeywordsArray;
        itemData.product = data;
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });

    await docRef.collection('items').doc(request.params.itemID)
    .get()
    .then((doc) => {
        if (!doc.exists) {
            return response.status(404).json({ error: 'Barang tidak ditemukan' })
        }
        
        if (doc.exists) {
            const data = doc.data();
            delete data.searchKeywordsArray;
            id = doc.id;
            itemData.item = {...data,id};
            return response.json(itemData);

        }	
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
        
};

exports.postOneItem = async (request, response) => {
    try {
        const date = new Date();
        
        const ids = {
            productID: request.params.productID,
        }
        const newItem = {
            ...ids,
            name: request.body.name,
            stock: parseInt(request.body.stock),
            minimumStock: request.body.minimumStock,
            price: parseInt(request.body.price),
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
                return response.status(404).json({ message: 'Product not found' })
            }
        })
        //end check if new item valid
        
        newItem.note = request.body.note || '';
        
        const searchKeywordsArray = await createSubstringArray(newItem.name);
        newItem.searchKeywordsArray = searchKeywordsArray;
        
        const res = request.body.name.toLowerCase().split(" ");
        const itemUIDArr = res.filter(item=>{
            return item!="";
        })

        const itemUID = itemUIDArr.join("-");
        newItem.itemUID = itemUID;
        
        //check if item alread exists
        // await db.doc(`/products/${newItem.productID}/items`)
        const itemFound = await db
        .collection('products')
        .doc(newItem.productID)
        .collection('items')
        .where('itemUID','==',newItem.itemUID)
        .get()
        if(itemFound.empty){
            db
            .collection('products')
            .doc(newItem.productID)
            .collection('items')
            .add(newItem)
            .then((doc)=>{
                const responseItem = newItem;
                delete responseItem.searchKeywordsArray;
                responseItem.id = doc.id;
                return responseItem;
            })
            .then(async (responseItem)=>{

                const month = date.getMonth()+1;
                const year = date.getFullYear();
                const newMonthlyStock = {
                    // ...ids,
                    itemID: responseItem.id,
                    month: month,
                    month_name:monthNames[month-1],
                    year: year,
                    stock: responseItem.stock,
                    in: 0,
                    out: 0,
                    createdAt: date,
                    updatedAt: date,
                }
                monthlyStockID = responseItem.id + "-" + year + "-" + month
                await db
                .collection('products')
                .doc(newItem.productID)
                .collection('items_monthly_stock')
                .doc(monthlyStockID)
                .set(newMonthlyStock)

                
                return response.json(responseItem);
            })
            .catch((err) => {
                response.status(500).json({ error: err,message:err });
                console.error(err);
            });
        }else{
            return response.status(400).json({ message: 'Barang dengan nama ' + newItem.name + ' sudah ada' });
        }

    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: error });
    }
};

exports.uploadImage = (request, response) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    let fields = {};

    const busboy = new BusBoy({ headers: request.headers });

    let imageFileName = {};
    let imagesToUpload = [];
    let imageToAdd = {};
    let imagesItem = [];

    busboy.on('field', (fieldname, fieldvalue) => {
        fields[fieldname] = fieldvalue;
    });

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res
                .status(400)
                .json({ error: 'Wrong file type submitted!' });
        }

        // Getting extension of any image
        const imageExtension = filename.split('.')[
            filename.split('.').length - 1
        ];

        // Setting filename
        imageFileName = request.params.productID + "-" + request.params.itemID + "-" + `${Math.round(Math.random() * 1000000000)}.${imageExtension}`;

        // Creating path
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToAdd = {
            imageFileName,
            filepath,
            mimetype,
        };

        file.pipe(fs.createWriteStream(filepath));
        //Add the image to the array
        imagesToUpload.push(imageToAdd);
    });

    busboy.on('finish', async () => {
        let promises = [];

        imagesToUpload.forEach((imageToBeUploaded) => {
            const image = {
                imageUrl : `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageToBeUploaded.imageFileName}?alt=media`,
                imageName : imageToBeUploaded.imageFileName
            }
            imagesItem.push(image);
            
            promises.push(
                admin
                    .storage()
                    .bucket()
                    .upload(imageToBeUploaded.filepath, {
                        resumable: false,
                        metadata: {
                            metadata: {
                                contentType: imageToBeUploaded.mimetype,
                            },
                        },
                    })
            );
        });

        try {
            await Promise.all(promises);
            
            const documentItem = db.doc(`/products/${request.params.productID}/items/${request.params.itemID}`);
            // documentItem.update({
            //     imagesItem
            // });
            documentItem.update("imagesItem",fieldValue.arrayUnion(...imagesItem));
            db.collection('items_posted').doc(request.params.itemID).update("imagesItem",fieldValue.arrayUnion(...imagesItem));
            
            return response.json({
                message: `Images URL: ${imagesItem}`,
            });
            
        } catch (err) {
            console.log(err);
            response.status(500).json(err);
        }
    });

    busboy.end(request.rawBody);
};

deleteImage = (imageName) => {
    const bucket = admin.storage().bucket();
    const path = `${imageName}`
    return bucket.file(path).delete()
    .then(() => {
        return
    })
    .catch((error) => {
        return
    })
}
exports.deleteItemImage = async (request, response) => {
    const deleted_images = request.body.deleted_images;
    const documentItem = db.doc(`/products/${request.params.productID}/items/${request.params.itemID}`);

    const promises = [];

    deleted_images.forEach(function(image){
        promises.push(
            deleteImage(image.imageName)
        )
    });

    try {
        await Promise.all(promises);
        documentItem.update("imagesItem",fieldValue.arrayRemove(...deleted_images));
        db.collection('items_posted').doc(request.params.itemID).update("imagesItem",fieldValue.arrayRemove(...deleted_images));
        return response.json({ message: 'Image deleted successfully' });
    }catch (err) {
        return response.status(404).json({ error: err });
    }
};

exports.editItem = async ( request, response ) => { 
    if (request.body.name == undefined || request.body.name.trim() === '') {
        return response.status(400).json({ name: 'Must not be empty' });
    }
    if(!request.params.itemID){
        response.status(403).json({message: 'Not allowed to edit'});
    }
    let updateItem = Object.fromEntries(Object.entries(request.body).filter(([key, value]) => value != null) );
    if(updateItem.price){
        updateItem.price = parseInt(updateItem.price);
    }
    if(updateItem.stock){
        updateItem.stock = parseInt(updateItem.stock);
    }
    updateItem.updatedAt = new Date();
    const res = updateItem.name.toLowerCase().split(" ");
    const nameArr = res.filter(item=>{
        return item!="";
    });
    const itemUID = nameArr.join("-");
    updateItem.itemUID = itemUID; 
    let isEmpty = false;
    let isPosted = false;
    let document = db.collection('products').doc(`${request.params.productID}`).collection('items').doc(`${request.params.itemID}`);
    await document.get()
    .then(async (doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ error: 'Barang tidak ditemukan' })
        }else {
            isPosted = doc.data().isPosted || false;
        }
        if(doc.data().name!=updateItem.name){
            try{
                const productsRef = db.collection('products')
                const item = await productsRef
                .doc(`${request.params.productID}`).collection('items')
                .where('itemUID', '==', updateItem.itemUID)
                .limit(1).get()
                .then()
                .catch((err) => {
                    return response.status(500).json({ error: err })
                });
                if(!item.empty){
                    isEmpty = true;
                    return response.status(400).json({ item: 'Barang ' + updateItem.name + ' sudah ada' });
                }

            }catch (err) {
                return response.status(500).json({ error: err });
            }

        }
    })
    .catch((err) => {
        return response.status(500).json({ error: err })
    });
    const searchKeywordsArray = await createSubstringArray(updateItem.name);
    updateItem.searchKeywordsArray = searchKeywordsArray;
    if(isPosted){
        db.collection('items_posted').doc(request.params.itemID).update(updateItem)
        .then(()=> {
            response.json({message: 'Updated successfully'});
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ 
                    error: err.code 
            });
        });
    }
    if(!isEmpty){
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
    }
};

exports.deleteItem = async (request, response) => {
    
    try {
        const queryItemDailyStock = await db.collection('products').doc(request.params.productID).collection('items_daily_stock').where('itemID','==',request.params.itemID);
        await queryItemDailyStock.get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                doc.ref.delete();
                });
            })
            .catch((err) => {
                console.error(err);
                return response.status(500).json({ error: err.code,message: 'Server error' });
            });
    }catch (err) {
        return response.status(404).json({ error: err });
    }

    try {
        const queryItemMonthlyStock = await db.collection('products').doc(request.params.productID).collection('items_monthly_stock').where('itemID','==',request.params.itemID);
        await queryItemMonthlyStock.get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                doc.ref.delete();
                });
            })
            .catch((err) => {
                console.error(err);
                return response.status(500).json({ error: err.code,message: 'Server error' });
            });
    }catch (err) {
        return response.status(404).json({ error: err });
    }
    const documentItem = db.doc(`/products/${request.params.productID}/items/${request.params.itemID}`);
    await documentItem
        .get()
        .then(async (doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Barang tidak ditemukans' })
            }else{
                if(doc.data().isPosted){
                    try {
                        const itemPosted = await db.collection('items_posted').doc(request.params.itemID);
                        itemPosted.delete();
                    }catch (err) {
                        return response.status(404).json({ error: err });
                    }
                }
            }

            if(doc.data().imagesItem){
                const deleted_images = doc.data().imagesItem;
                const promises = [];
                deleted_images.forEach(function(image){
                    promises.push(
                        deleteImage(image.imageName)
                    )
                });
                try {
                    await Promise.all(promises);

                    return documentItem.delete();
                }catch (err) {
                    return response.status(404).json({ error: err });
                }

            }else {
                return documentItem.delete();
            }

        })
        .then(() => {
            response.json({ message: 'Delete successfull' });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code,message: 'Server error' });
        });
};

exports.updateStock = async (request, response) => {
    const dateNow = new Date();
    const requestBody = request.body;
    if (requestBody.date == undefined || requestBody.date === '') {
        return response.status(400).json({ date: 'Must not be empty' });
    }
    if (requestBody.month == undefined || requestBody.month === '') {
        return response.status(400).json({ month: 'Must not be empty' });
    }
    if (requestBody.year == undefined || requestBody.year === '') {
        return response.status(400).json({ year: 'Must not be empty' });
    }
    const date = parseInt(requestBody.date);
    const month = parseInt(requestBody.month);
    const year = parseInt(requestBody.year);
    const requestStockIn = parseInt(requestBody.in);
    const requestStockOut = parseInt(requestBody.out);
    const requestTotalStock = parseInt(requestStockIn) - parseInt(requestStockOut);
    let currentStock = {
        itemTotal: 0,
        monthlyIn: 0,
        monthlyOut: 0,
        monthlyTotal: 0,
        dailyIn: 0,
        dailyOut: 0,
        dailyTotal: 0
    }
    let isPosted = false;
    const dailyStockID = request.params.itemID + "-" + requestBody.year + "-" + requestBody.month + "-" + requestBody.date;
    const monthlyStockID = request.params.itemID + "-" + requestBody.year + "-" + requestBody.month;
    const documentItem = db.doc(`/products/${request.params.productID}/items/${request.params.itemID}`);
    const documentItemDailyStock = db.doc(`/products/${request.params.productID}/items_daily_stock/${dailyStockID}`);
    const documentItemMonthlyStock = db.doc(`/products/${request.params.productID}/items_monthly_stock/${monthlyStockID}`);
    let currentDataItem;
    await documentItem
    .get()
    .then((doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ error: 'Barang tidak ditemukan' })
        }else{
            const data = doc.data();
            currentDataItem = data;
            currentStock.itemTotal = data.stock;
            isPosted = doc.data().isPosted || false;
        }
    })
    await documentItemDailyStock
    .get()
    .then(async(doc) => {
        if (!doc.exists) {
            // return response.status(404).json({ error: 'Barang tidak ditemukan' })

            try{
                const newDailyStock = {
                    // ...ids,
                    itemID: request.params.itemID,
                    date: date,
                    month: month,
                    month_name:monthNames[month-1],
                    year: year,
                    stock: requestTotalStock,
                    in: requestStockIn,
                    out: requestStockOut,
                    createdAt: dateNow,
                    updatedAt: dateNow,
                }
                await db
                .collection('products')
                .doc(request.params.productID)
                .collection('items_daily_stock')
                .doc(dailyStockID)
                .set(newDailyStock)

            }catch(err){
                console.error(err);
                return response.status(500).json({ error: err.code });
            }
        }
        else{
            currentStock.dailyIn = doc.data().in;
            currentStock.dailyOut = doc.data().out;
            currentStock.dailyTotal = doc.data().stock;

            return currentStock;
        };
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err.code });
    });
    await documentItemMonthlyStock
        .get()
        .then(async(doc) => {
            if (!doc.exists) {
                // return response.status(404).json({ error: 'Barang tidak ditemukan' })

                try{
                    const newMonthlyStock = {
                        // ...ids,
                        itemID: request.params.itemID,
                        month: month,
                        month_name:monthNames[month-1],
                        year: year,
                        stock: requestTotalStock,
                        in: requestStockIn,
                        out: requestStockOut,
                        createdAt: dateNow,
                        updatedAt: dateNow,
                    }
                    await db
                    .collection('products')
                    .doc(request.params.productID)
                    .collection('items_monthly_stock')
                    .doc(monthlyStockID)
                    .set(newMonthlyStock)

                }catch(err){
                    console.error(err);
                    return response.status(500).json({ error: err.code });
                }
            }
            else{
                currentStock.monthlyIn = doc.data().in;
                currentStock.monthlyOut = doc.data().out;
                currentStock.monthlyTotal = doc.data().stock;

                return currentStock;
            };
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });

    try {
            
        let updateItem = {
            stock: currentStock.itemTotal + requestTotalStock,
            updatedAt: dateNow,
        }

        let updatDailyStock = {
            stock: currentStock.dailyTotal + requestTotalStock,
            in: currentStock.dailyIn + requestStockIn,
            out: currentStock.dailyOut + requestStockOut,
            updatedAt: dateNow,
        }

        let updateMonthlyStock = {
            stock: currentStock.monthlyTotal + requestTotalStock,
            in: currentStock.monthlyIn + requestStockIn,
            out: currentStock.monthlyOut + requestStockOut,
            updatedAt: dateNow,
        }

        let updateHistoryItem = {
            description: requestBody.description,
            type: requestBody.type || 'stock_update',
            createdAt: dateNow,
            updatedAt: dateNow,
            data: {
                productID: request.params.productID,
                itemID: request.params.itemID,
                date: date,
                month: month,
                month_name:monthNames[month-1],
                year: year,
                in: requestStockIn,
                out: requestStockOut,
                item: currentDataItem
            }
            
        }
        

        await documentItemDailyStock.update(updatDailyStock)
        .then(()=> {
            return;
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ 
                    error: err.code 
            });
        });
        
        await documentItemMonthlyStock.update(updateMonthlyStock)
        .then(()=> {
            return;
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ 
                    error: err.code 
            });
        });
        
        await db.collection('items_history').add(updateHistoryItem)
        .then(()=> {
            return;
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ 
                    error: err.code 
            });
        });
        
        if(isPosted){
            await db.collection('items_posted').doc(request.params.itemID).update(updateItem)
            .then(()=> {
                return;
            })
            .catch((err) => {
                console.error(err);
                return response.status(500).json({ 
                    error: err.code 
                });
            });
        }
        
        await documentItem.update(updateItem)
        .then(()=> {
            response.json({message: 'Updated successfully'});
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ 
                    error: err.code 
            });
        });

    }catch(err){
        console.error(err);
        return response.status(500).json({ error: err.code });
    }
}

exports.updateMonthlyStock = async (request, response) => {
    const date = new Date();

    const requestBody = request.body;

    
    if (requestBody.month == undefined || requestBody.month.trim() === '') {
        return response.status(400).json({ month: 'Must not be empty' });
    }
    if (requestBody.year == undefined || requestBody.year.trim() === '') {
        return response.status(400).json({ year: 'Must not be empty' });
    }




    const requestStockIn = parseInt(requestBody.in);
    const requestStockOut = parseInt(requestBody.out);
    const requestTotalStock = requestStockIn-requestStockOut;

    let currentStock = {
        itemTotal: 0,
        monthlyIn: 0,
        monthlyOut: 0,
        monthlyTotal: 0
    }


    const monthlyStockID = request.params.itemID + "-" + requestBody.year + "-" + requestBody.month;

    const documentItem = db.doc(`/products/${request.params.productID}/items/${request.params.itemID}`);
    const document = db.doc(`/products/${request.params.productID}/items_monthly_stock/${monthlyStockID}`);


    await documentItem
    .get()
    .then((doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ error: 'Barang tidak ditemukan' })
        }else{
            const data= doc.data();
            currentStock.itemTotal = data.stock;
        }
    })


    await document
        .get()
        .then(async(doc) => {
            if (!doc.exists) {
                // return response.status(404).json({ error: 'Barang tidak ditemukan' })

                try{
                    const month = requestBody.month;
                    const year = requestBody.year;
                    const newMonthlyStock = {
                        // ...ids,
                        itemID: request.params.itemID,
                        month: month,
                        month_name:monthNames[month-1],
                        year: year,
                        stock: currentStock.itemTotal,
                        in: 0,
                        out: 0,
                        createdAt: date,
                        updatedAt: date,
                    }
                    await db
                    .collection('products')
                    .doc(request.params.productID)
                    .collection('items_monthly_stock')
                    .doc(monthlyStockID)
                    .set(newMonthlyStock)

                    return response.json(newMonthlyStock);
                }catch(err){
                    console.error(err);
                    return response.status(500).json({ error: err.code });
                }
            }
            else{
                currentStock.monthlyIn = doc.data().in;
                currentStock.monthlyOut = doc.data().out;
                currentStock.monthlyTotal = doc.data().stock;

                return currentStock;
            };
        })
        // .then((data) => {
        //     response.json({ data: data });
        // })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });

        
        try {
            
            let updateItem = {
                stock: currentStock.itemTotal + requestTotalStock,
            }

            let updateMonthlyStock = {
                stock: currentStock.monthlyTotal + requestTotalStock,
                in: currentStock.monthlyIn + requestStockIn,
                out: currentStock.monthlyOut + requestStockOut,
            }

            await document.update(updateMonthlyStock)
            .then(()=> {
                return;
            })
            .catch((err) => {
                console.error(err);
                return response.status(500).json({ 
                        error: err.code 
                });
            });;
            
            await documentItem.update(updateItem)
            .then(()=> {
                response.json({message: 'Updated successfully'});
            })
            .catch((err) => {
                console.error(err);
                return response.status(500).json({ 
                        error: err.code 
                });
            });

        }catch(err){
            console.error(err);
            return response.status(500).json({ error: err.code });
        }
        
};



exports.getItemsHistory = async (request, response) => {
    const productID = request.params.productID;
    const queryRequest = request.query;
    const limit = queryRequest.limit ? parseInt(queryRequest.limit) : 10;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    
    //query get all data for counting total data
    let queryGetAll = db.collection('items_history')
    .where('data.productID','==',productID)
    .orderBy('createdAt',order)

    let queryGetData = db.collection('items_history')
    .where('data.productID','==',productID)
    .orderBy('createdAt',order)
    .limit(limit);

    const snapshot = await queryGetAll.get();
    const total = snapshot.docs.length;
    const first_page = 1;
    const last_page = Math.ceil(total/limit);
    const current_page = queryRequest.page ? queryRequest.page : 1;

    let first_index = total > 0 ? 1 : 0 ;
    let last_index = total > limit ? limit : total;

    if(current_page>1){
        const first = db.collection('items_history')
        .where('data.productID','==',productID)
        .orderBy('createdAt',order)
        .limit((limit*current_page)-limit);
        const snapshotFirst = await first.get();
        const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
        
        queryGetData = db.collection('items_history')
        .where('data.productID','==',productID)
        .orderBy('createdAt',order)
        .startAfter(last.data().createdAt)
        .limit(limit)

        const snapshot = await queryGetData.get();
        first_index = ((limit*current_page)-(limit-1));
        last_index = first_index + snapshot.docs.length-1;
    }

    queryGetData.get()
    .then((docs)=>{
        let userOrders={
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
        docs.forEach(doc=>{
            userOrders.data.push({
                id:doc.id,
                ...doc.data(),
            })
        })
        return response.json(userOrders);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
}
