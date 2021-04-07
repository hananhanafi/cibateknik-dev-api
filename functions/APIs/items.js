const { db } = require('../util/admin');
const { validateEmptyData } = require('../util/validators');
const { monthNames } = require('../util/constants');
const { createSubstringArray } = require('../util/helpers');

exports.getAllItems = async (request, response) => {
    let items = {
        product:null,
        items:[],
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

    await docRef.collection('items')
    .orderBy('name')
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
        
    return response.json({items,message: 'Succed'});
};



exports.getOneItem = async (request, response) => {
    
    let itemData = null;
    const docRef = db.collection('products').doc(request.params.productID)

    await docRef.collection('items').doc(request.params.itemID)
    .get()
    .then((doc) => {
        if (!doc.exists) {
            return response.status(404).json({ error: 'Item not found' })
        }
        
        if (doc.exists) {
            const data = doc.data();
            delete data.searchKeywordsArray;
            id = doc.id;
            itemData = {...data,id};
            return response.json(itemData);

        }	
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
        
};

// exports.postOneItem = async (request, response) => {

//     try {

//         const date = new Date();
        
//         const ids = {
//             productID: request.body.productID,
//             brandID: request.body.brandID,
//             supplierID: request.body.supplierID,
//         }
        
//         const newItem = {
//             ...ids,
//             name: request.body.name,
//             stock: request.body.stock,
//             minimumStock: request.body.minimumStock,
//             price: request.body.price,
//             note: request.body.note,
//             createdAt: date,
//             updatedAt: date,
//             additionalData: request.body.additionalData
//         }

        
//         //check if new item valid
//         const { valid, errors } = validateEmptyData(newItem);
//         if (!valid) return response.status(400).json(errors);

//         await db.doc(`/products/${newItem.productID}`)
//         .get()
//         .then((doc)=>{
//             if(!doc.exists){
//                 return response.status(404).json({ error: 'Product not found' })
//             }
//         })

//         await db.doc(`/brands/${newItem.brandID}`)
//         .get()
//         .then((doc)=>{
//             if(!doc.exists){
//                 return response.status(404).json({ error: 'Brand not found' })
//             }
//         })
        
//         await db.doc(`/suppliers/${newItem.supplierID}`)
//         .get()
//         .then((doc)=>{
//             if(!doc.exists){
//                 return response.status(404).json({ error: 'Supplier not found' })
//             }
//         })
//         //end check if new item valid
        
        
//         const res = request.body.name.toLowerCase().split(" ");
//         const itemIDArr = res.filter(item=>{
//             return item!="";
//         })

//         const itemID = itemIDArr.join("-");

//         //check if item alread exists
//         await db.doc(`/items/${itemID}`)
//         .get()
//         .then((doc)=>{
//             if(doc.exists){
//                 return response.status(404).json({ error: 'Item already exists' })
//             }
//         })
        

//         const newMonthlyItem = {
//             ...ids,
//             itemID : itemID,
//             startStock : newItem.stock,
//             endStock: newItem.stock,
//             year: date.getFullYear(),
//             month: monthNames[date.getMonth()],
//             createdAt: date,
//             updatedAt: date,
//         }

//         const newDailyItem = {
//             ...ids,
//             itemID : itemID,
//             in : newItem.stock,
//             out : 0,
//             year : date.getFullYear(),
//             month : monthNames[date.getMonth()],
//             date : date.getDate(),
//             createdAt: date,
//             updatedAt: date,
//         }
        
//         //create item monthly and daily stock id
//         itemMonthlyId = itemID + "_" + newMonthlyItem.year + "_" + newMonthlyItem.month;
//         itemDailyId = itemID + "_" + date.toISOString();

//         db
//         .collection('items')
//         .doc(itemID)
//         .set(newItem)
//         .then((doc)=>{
//             const responseItem = newItem;
//             responseItem.id = doc.id;
//             return responseItem;
//         })
//         .then(async (responseItem)=>{
            
//             await db.collection('items_monthly_stock').doc(itemMonthlyId)
//             .set(newMonthlyItem)
//             .then((doc)=>{
//                 responseItem.monthlyStock = {id:doc.id,...newMonthlyItem};
//             })
//             .catch((err) => {
//                 response.status(500).json({ error: err });
//                 console.error(err);
//             });

//             await db.collection('items_daily_stock').doc(itemDailyId)
//             .set(newDailyItem)
//             .then((doc)=>{
//                 responseItem.dailyStock =  {id:doc.id,...newDailyItem};
//             })
//             .catch((err) => {
//                 response.status(500).json({ error: err });
//                 console.error(err);
//             });

//             return response.json(responseItem);


//         })
//         .catch((err) => {
// 			response.status(500).json({ error: err });
// 			console.error(err);
// 		});

//     } catch (error) {
//         console.error(error);
//         return response.status(500).json({ error: error });
//     }
// };


exports.postOneItem = async (request, response) => {

    try {

        const date = new Date();
        
        const ids = {
            productID: request.params.productID,
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
                response.status(500).json({ error: err });
                console.error(err);
            });
        }else{
            return response.status(400).json({ product: 'Barang ' + newItem.name + ' sudah ada' });
        }
        
        

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
};

exports.updateStock = async (request, response) => {
    const dateNow = new Date();
    const requestBody = request.body;

    if (requestBody.date == undefined || requestBody.date.trim() === '') {
        return response.status(400).json({ date: 'Must not be empty' });
    }
    if (requestBody.month == undefined || requestBody.month.trim() === '') {
        return response.status(400).json({ month: 'Must not be empty' });
    }
    if (requestBody.year == undefined || requestBody.year.trim() === '') {
        return response.status(400).json({ year: 'Must not be empty' });
    }
    
    const date = requestBody.date;
    const month = requestBody.month;
    const year = requestBody.year;
    const requestStockIn = parseInt(requestBody.in);
    const requestStockOut = parseInt(requestBody.out);
    const requestTotalStock = requestStockIn-requestStockOut;

    
    let currentStock = {
        itemTotal: 0,
        monthlyIn: 0,
        monthlyOut: 0,
        monthlyTotal: 0,
        dailyIn: 0,
        dailyOut: 0,
        dailyTotal: 0
    }

    const dailyStockID = request.params.itemID + "-" + requestBody.year + "-" + requestBody.month + "-" + requestBody.date;
    const monthlyStockID = request.params.itemID + "-" + requestBody.year + "-" + requestBody.month;

    const documentItem = db.doc(`/products/${request.params.productID}/items/${request.params.itemID}`);
    const documentItemDailyStock = db.doc(`/products/${request.params.productID}/items_daily_stock/${dailyStockID}`);
    const documentItemMonthlyStock = db.doc(`/products/${request.params.productID}/items_monthly_stock/${monthlyStockID}`);

    await documentItem
    .get()
    .then((doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ error: 'Item not found' })
        }else{
            const data= doc.data();
            currentStock.itemTotal = data.stock;
        }
    })
    
    await documentItemDailyStock
    .get()
    .then(async(doc) => {
        if (!doc.exists) {
            // return response.status(404).json({ error: 'Item not found' })

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
                // return response.status(404).json({ error: 'Item not found' })

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
            type: 'stock update',
            itemID: request.params.itemID,
            date: date,
            month: month,
            month_name:monthNames[month-1],
            year: year,
            in: currentStock.dailyIn + requestStockIn,
            out: currentStock.dailyOut + requestStockOut,
            createdAt: dateNow,
            updatedAt: dateNow,
            
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
            return response.status(404).json({ error: 'Item not found' })
        }else{
            const data= doc.data();
            currentStock.itemTotal = data.stock;
        }
    })


    await document
        .get()
        .then(async(doc) => {
            if (!doc.exists) {
                // return response.status(404).json({ error: 'Item not found' })

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



exports.deleteItem = (request, response) => {
    const document = db.doc(`/products/${request.params.productID}/item/${request.params.itemID}`);
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
    let document = db.collection('products').doc(`${request.params.productID}`).collection('items').doc(`${request.params.itemID}`);

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




