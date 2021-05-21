

exports.updateSoldItem = async (request, response) => {
    try {
        
        const items_id = request.body.items_id;

        await items_id.forEach(async item => {
            let itemData = {};
            let itemID = "";

            await db
            .doc(`/items/${item}`).get().then((doc)=>{
                if (!doc.exists) {
                    return response.status(404).json({ item: 'Barang tidak ditemukan' })
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


    return response.status(200).json({"message":"Berhasil menghapus sold item"});
};



