const { db, fieldValue, firebase } = require('../util/admin');

exports.addWishlist = async (request, response) => {
    try {
        const userID = request.query.userID || request.user.uid;
        const itemID = request.body.itemID;
        
        let listItemID = {listItemID: [itemID]}
        const documentUserWishlist = db.collection('users_wishlist').doc(userID)

        documentUserWishlist.get()
        .then((doc)=>{
            if (!doc.exists) {
                documentUserWishlist.set(listItemID)
            }else{
                listItemID = [];
                listItemID.push(itemID);
                documentUserWishlist.update('listItemID',fieldValue.arrayUnion(...listItemID));
            }
        })
        
    } 
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }

    return response.status(200).json({"message":"Berhasil menambahkan barang ke dalam wishlist"});
};

exports.deleteUserWishlist = async (request, response) => {
    try {
        const userID = request.query.userID || request.user.uid;
        const listItemID = [request.body.itemID];
        const documentUserWishlist = db.collection('users_wishlist').doc(userID)
        documentUserWishlist.update('listItemID',fieldValue.arrayRemove(...listItemID));
    } 
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }

    return response.status(200).json({"message":"Berhasil menghapus item pada wishlist barang"});
};


exports.getUserWishlist = async (request, response) => {
    const userID = request.query.userID || request.user.uid;
    const documentUserWishlist = db.collection('users_wishlist').doc(userID);
    documentUserWishlist.get()
    .then((doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ message: 'Barang tidak ditemukan' })
        }else{
            return response.json(doc.data());
        }
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
}

exports.getUserWishlistWithItem = async (request, response) => {
    const userID = request.query.userID || request.user.uid;
    const documentUserWishlist = db.collection('users_wishlist').doc(userID)

    let listItemID = [""];
    
    await documentUserWishlist.get()
    .then(async (doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ message: 'Barang tidak ditemukan' })
        }else{
            if(doc.data().listItemID && doc.data().listItemID.length>0){
                listItemID = doc.data().listItemID;
            }
        }
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });

    
    const queryRequest = request.query;
    const limit = queryRequest.limit ? parseInt(queryRequest.limit) : 2;

    //query get all data for counting total data
    let queryGetAll = db.collection('items_posted')
    .orderBy('name')
    .where('itemID','in',listItemID);

    let queryGetData = db.collection('items_posted')
    .orderBy('name')
    .where('itemID','in',listItemID)
    .limit(limit);

    const snapshot = await queryGetAll.get();
    const total = snapshot.docs.length;
    const first_page = 1;
    const last_page = Math.ceil(total/limit);
    const current_page = queryRequest.page ? queryRequest.page : 1;


    let first_index = total > 0 ? 1 : 0 ;
    let last_index = total > limit ? limit : total;


    if(current_page>1){
        const first = db.collection('items_posted')
        .orderBy('name')
        .where('itemID','in',listItemID)
        .limit((limit*current_page)-limit);
        const snapshotFirst = await first.get();
        const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
        
        queryGetData = db.collection('items_posted')
        .orderBy('name')
        .where('itemID','in',listItemID)
        .startAfter(last.data().name)
        .limit(limit)

        const snapshot = await queryGetData.get();
        first_index = ((limit*current_page)-(limit-1));
        last_index = first_index + snapshot.docs.length-1;
    }

    queryGetData.get()
    .then((data) => {
        let items = {
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
            items.data.push(appObj);
        });
        return response.json(items);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });

}
