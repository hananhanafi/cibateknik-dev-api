const { db } = require('../util/admin');
const { createSubstringArray } = require('../util/helpers');
const { validateEmptyData } = require('../util/validators');

exports.getAllItemsPosted = async (request, response) => {
    const queryRequest = request.query;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    const search = queryRequest.search;
    const limit = queryRequest.limit ? queryRequest.limit : 2;

    //query get all data for counting total data
    let queryGetAll = db.collection('items_posted').orderBy('createdAt', order);
    
    //query get limited data for pagination
    let queryGetData = db.collection('items_posted')
    .orderBy('createdAt', order)
    .limit(limit);
    
    if(search){
        queryGetAll = db.collection('items_posted')
        .orderBy('createdAt', order)
        .where("searchKeywordsArray", "array-contains", search.toLowerCase())

        queryGetData = db.collection('items_posted')
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
            const first = db.collection('items_posted')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];

            queryGetData = db.collection('items_posted')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .startAfter(last.data().createdAt)
            .limit(limit)
        }else{
            const first = db.collection('items_posted')
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
            
            queryGetData = db.collection('items_posted')
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
        let items_posted = {
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
            const data = doc.data();
            let currentID = doc.id;
            let appObj = { ...data, ['id']: currentID };

            items_posted.data.push(appObj);
        });
        return response.json(items_posted);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
};

exports.getAllItemsPostedByProduct = async (request, response) => {
    const queryRequest = request.query;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    const search = queryRequest.search;
    const limit = queryRequest.limit ? queryRequest.limit : 10;

    const productID = request.params.productID;
    //query get all data for counting total data
    let queryGetAll = db.collection('items_posted').orderBy('createdAt', order).where('productID','==',productID);
    
    //query get limited data for pagination
    let queryGetData = db.collection('items_posted')
    .orderBy('createdAt', order).where('productID','==',productID)
    .limit(limit);
    
    if(search){
        queryGetAll = db.collection('items_posted')
        .orderBy('createdAt', order).where('productID','==',productID)
        .where("searchKeywordsArray", "array-contains", search.toLowerCase())

        queryGetData = db.collection('items_posted')
        .orderBy('createdAt', order).where('productID','==',productID)
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
            const first = db.collection('items_posted').where('productID','==',productID)
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];

            queryGetData = db.collection('items_posted').where('productID','==',productID)
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .startAfter(last.data().createdAt)
            .limit(limit)
        }else{
            const first = db.collection('items_posted').where('productID','==',productID)
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
            
            queryGetData = db.collection('items_posted').where('productID','==',productID)
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
        let items_posted = {
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
            const data = doc.data();
            let currentID = doc.id;
            let appObj = { ...data, ['id']: currentID };

            items_posted.data.push(appObj);
        });
        return response.json(items_posted);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
};

exports.getOneItemPosted = (request, response) => {
    console.log("itemposted",request.params.itemID);
    const document = db.doc(`/items_posted/${request.params.itemID}`);
    document
    .get()
    .then((doc) => {
        if (!doc.exists) {
            return response.status(404).json({ message: 'Barang tidak ditemukan' })
        }
        let itemData = {};
        if (doc.exists) {
            itemData = doc.data();
            itemData.id = doc.id;
            return response.json(itemData);
        }	
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err.code });
    });
};

exports.addPostedItem = async (request, response) => {
    try {
        const documentItem = db.doc(`/products/${request.params.productID}/items/${request.params.itemID}`);
        await documentItem.get().then((doc)=>{
            if (!doc.exists) {
                return response.status(404).json({ item: 'Barang tidak ditemukan' })
            }else{
                itemID = doc.id;
                itemData = doc.data();
                itemData.createdAt = new Date();
                itemData.updatedAt = new Date();
                itemData.description = request.body.description || '';
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
        .then(async ()=>{
            //success add item posted
        })
        .catch (error => {
            console.error(error);
            return response.status(500).json({ error: error });
        })

        const isPosted = {
            isPosted : true
        }
        try{
            await documentItem.update(isPosted)
        }
        catch (error) {
            console.error(error);
            return response.status(500).json({ error: error });
        }
    
        response.json({ message: 'Berhasil menambahkan item pada katalog' });
    } 
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }

    return response.status(200).json({"message":"Berhasil menambahkan item pada katalog"});
};

exports.updatePostedItem = async (request, response) => {
    try {
        // const product_id = request.body.product_id;
        const item_id = request.params.itemID;
        const description = request.body.description;
        const updateItemPosted ={
            description : description
        }
        
        let documentItemPosted = db.collection('items_posted').doc(item_id);

        await documentItemPosted.get()
        .then((doc)=>{
            if (!doc.exists) {
                return response.status(404).json({ message: 'Produk tidak ditemukan' })
            }
        })
        .catch((err) => {
            return response.status(404).json({ message: 'Produk tidak ditemukan' })
        });

        documentItemPosted.update(updateItemPosted)
        .then(()=> {
            response.json({message: 'Updated successfully', data: updateItemPosted});
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ 
                    error: err.code 
            });
        });
    } 
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
    return response.status(200).json({"message":"Berhasil mengupdate baramg katalog", data: updateItemPosted});
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
                        return response.status(404).json({ error: 'Barang tidak ditemukan' })
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
