const { db, fieldValue, firebase } = require('../util/admin');

exports.addItemToCart = async (request, response) => {
    try {
        // const listItemID = request.body.items_id;
        const userID = request.body.userID;
        const itemID = request.body.itemID;
        const amount = request.body.amount;
        const newItemCart = {
            itemID : itemID,
            amount : amount,
        }
        let itemList = {itemList: [newItemCart]}
        console.log("userID",userID);
        console.log("itemlist",itemList);
        const documentUserCart = db.collection('users_cart').doc(userID)

        documentUserCart.get()
        .then((doc)=>{
            if (!doc.exists) {
                documentUserCart.set(itemList)
            }else{
                itemList = [];
                itemList.push(newItemCart);
                

                const existItemList = doc.data().itemList;
                const isItemExistInCart = existItemList.find(item=>{return item.itemID == itemID});
                
                if(isItemExistInCart){
                    documentUserCart.update('itemList',fieldValue.arrayRemove(isItemExistInCart));
                }

                if(newItemCart.amount>0){
                    documentUserCart.update('itemList',fieldValue.arrayUnion(...itemList));
                }
            }
        })
        
        // documentUserCart.set('itemList',fieldValue.arrayUnion(...newItemCart));
        // documentUserCart.set(itemList)
    } 
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }

    return response.status(200).json({"message":"Berhasil menambahkan barang ke dalam keranjang"});
};


exports.getUserCart = async (request, response) => {
    const userID = request.query.userID || request.user.uid;
    const documentUserCart = db.collection('users_cart').doc(userID);
    documentUserCart.get()
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


exports.getUserCartWithItem = async (request, response) => {
    const userID = request.query.userID || request.user.uid;
    const documentUserCart = db.collection('users_cart').doc(userID)

    let listItem = [];
    let listItemID = [""];
    
    await documentUserCart.get()
    .then(async (doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ message: 'Barang tidak ditemukan' })
        }else{
            listItem = doc.data().itemList;
            await doc.data().itemList.forEach(item => {
                listItemID.push(item.itemID)
            });
        }
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });

    let queryGetData = db.collection('items_posted')
    .orderBy('name')
    .where('itemID','in',listItemID);


    queryGetData.get()
    .then((data) => {
        let items = {
            data:[]
        };
        data.forEach((doc) => {
            const data = doc.data();
            let currentID = doc.id;
            let appObj = {};
            appObj.item = { ...data, ['id']: currentID };
            appObj.cart = listItem.find(item=> {return item.itemID == currentID});
            items.data.push(appObj);
        });
        return response.json(items);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });




}
