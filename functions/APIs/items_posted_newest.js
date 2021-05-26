const { db, fieldValue } = require('../util/admin');

exports.addCatalogNewestItem = async (request, response) => {
    try {
        const listItemID = request.body.items_id;
        const documentNewestItem = db.collection('catalog').doc('newest-item')
        documentNewestItem.update('listItemID',fieldValue.arrayUnion(...listItemID));
    } 
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }

    return response.status(200).json({"message":"Berhasil menambahkan item pada katalog barang terbaru"});
};


exports.deleteCatalogNewestItem = async (request, response) => {
    try {
        const listItemID = request.body.items_id;
        const documentNewestItem = db.collection('catalog').doc('newest-item')
        documentNewestItem.update('listItemID',fieldValue.arrayRemove(...listItemID));
    } 
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }

    return response.status(200).json({"message":"Berhasil menghapus item pada katalog barang terbaru"});
};


exports.getAllNewestItemsPosted = async (request, response) => {
    let listItemID = [];

    //query get limited data for pagination
    await db.collection('catalog').doc('newest-item')
    .get()
    .then((doc) => {
        if (!doc.exists) {
            return response.status(404).json({ message: 'Barang tidak ditemukan' })
        }
        if (doc.exists) {
            listItemID = doc.data().listItemID;
        }	
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err.code });
    });

    if(listItemID.length<1){
        return response.status(404).json({ message: 'Barang tidak ditemukan' })
    }

    const queryRequest = request.query;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    const search = queryRequest.search;
    const limit = queryRequest.limit ? parseInt(queryRequest.limit) : 12;

    //query get all data for counting total data
    let queryGetAll = db.collection('items_posted').orderBy('createdAt', order)
    .where('itemID','in',listItemID);
    
    //query get limited data for pagination
    let queryGetData = db.collection('items_posted')
    .orderBy('createdAt', order)
    .where('itemID','in',listItemID)
    .limit(limit);
    
    if(search){
        queryGetAll = db.collection('items_posted')
        .orderBy('createdAt', order)
        .where('itemID','in',listItemID)
        .where("searchKeywordsArray", "array-contains", search.toLowerCase())

        queryGetData = db.collection('items_posted')
        .orderBy('createdAt', order)
        .where('itemID','in',listItemID)
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
            .where('itemID','in',listItemID)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];

            queryGetData = db.collection('items_posted')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .where('itemID','in',listItemID)
            .startAfter(last.data().createdAt)
            .limit(limit)
        }else{
            const first = db.collection('items_posted')
            .orderBy('createdAt', order)
            .where('itemID','in',listItemID)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
            
            queryGetData = db.collection('items_posted')
            .orderBy('createdAt', order)
            .where('itemID','in',listItemID)
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


exports.getAllNewestItemsPostedByProduct = async (request, response) => {
    let listItemID = [];

    //query get limited data for pagination
    await db.collection('catalog').doc('newest-item')
    .get()
    .then((doc) => {
        if (!doc.exists) {
            return response.status(404).json({ message: 'Barang tidak ditemukan' })
        }
        let itemData = {};
        if (doc.exists) {
            // itemData = doc.data();
            // itemData.id = doc.id;
            listItemID = doc.data().listItemID;
        }	
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err.code });
    });

    if(listItemID.length<1){
        return response.status(404).json({ message: 'Barang tidak ditemukan' })
    }


    const queryRequest = request.query;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    const search = queryRequest.search;
    const limit = queryRequest.limit ? queryRequest.limit : 10;

    const productID = request.params.productID;
    //query get all data for counting total data
    let queryGetAll = db.collection('items_posted').orderBy('createdAt', order)
    .where('itemID','in',listItemID).where('productID','==',productID);
    
    //query get limited data for pagination
    let queryGetData = db.collection('items_posted')
    .orderBy('createdAt', order)
    .where('itemID','in',listItemID).where('productID','==',productID)
    .limit(limit);
    
    if(search){
        queryGetAll = db.collection('items_posted')
        .orderBy('createdAt', order)
        .where('itemID','in',listItemID).where('productID','==',productID)
        .where("searchKeywordsArray", "array-contains", search.toLowerCase())

        queryGetData = db.collection('items_posted')
        .orderBy('createdAt', order)
        .where('itemID','in',listItemID).where('productID','==',productID)
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
            .where('itemID','in',listItemID)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];

            queryGetData = db.collection('items_posted').where('productID','==',productID)
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .where('itemID','in',listItemID)
            .startAfter(last.data().createdAt)
            .limit(limit)
        }else{
            const first = db.collection('items_posted').where('productID','==',productID)
            .orderBy('createdAt', order)
            .where('itemID','in',listItemID)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
            
            queryGetData = db.collection('items_posted').where('productID','==',productID)
            .orderBy('createdAt', order)
            .where('itemID','in',listItemID)
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
