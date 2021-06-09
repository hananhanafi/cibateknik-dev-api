const { db } = require('../util/admin');
const { validateEmptyData } = require('../util/validators');

exports.createUserAddress = async (request, response) => {
    try {
        const date = new Date();
        const userID = request.query.userID || request.user.uid;
        const newAddress = {
            label: request.body.label,
            name: request.body.name,
            phone: request.body.phone,
            province: request.body.province,
            city: request.body.city,
            zipCode: request.body.zipCode,
            address: request.body.address,
            createdAt: date,
            updatedAt: date,
        }
        const { valid, errors } = validateEmptyData(newAddress);
        if (!valid) return response.status(400).json(errors);

        const collectionUserAddress = db.collection('users').doc(userID).collection('addresses')
        const snapsotCollectionUserAddress = await collectionUserAddress.get();
        const userAddresses = snapsotCollectionUserAddress.docs.length;

        if(userAddresses<1){
            newAddress.isMainAddress = true;
        }
        
        await collectionUserAddress.add(newAddress)
        .then((doc)=>{
            const responseAddress = newAddress;
            responseAddress.addressID = doc.id;
            responseAddress.id = doc.id;
            return response.json(responseAddress);
        })
        .catch((err) => {
            response.status(500).json({ message: 'Something went wrong' });
            console.error(err);
        });
    } 
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
};

exports.deleteUserAddress = async (request, response) => {
    const userID = request.query.userID || request.user.uid;
    const document = db.doc(`/users/${userID}/addresses/${request.params.addressID}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ message: 'Alamat tidak ditemukan' })
            }
            return document.delete();
        })
        .then(() => {
            response.json({ message: 'Delete successfull', data:{addressID:request.params.addressID} });
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};

exports.getUserAddresses = async (request, response) => {
    const userID = request.query.userID || request.user.uid;
    const collectionUserAddress = db.collection('users').doc(userID).collection('addresses')
    
    collectionUserAddress.get()
    .then((docs) => {
        let addresses = [];
        docs.forEach((doc) => {
            addresses.push({
                addressID: doc.id,
                isMainAddress: doc.data().isMainAddress,
                label: doc.data().label,
                name: doc.data().name,
                phone: doc.data().phone,
                province: doc.data().province,
                city: doc.data().city,
                zipCode: doc.data().zipCode,
                address: doc.data().address,
                createdAt: doc.data().createdAt,
                updatedAt: doc.data().updatedAt,
            });
        });
        return response.json(addresses);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
}

exports.editUserAddress = async (request, response) => {
    const userID = request.query.userID || request.user.uid;
    
    let updateAddress = Object.fromEntries(
        Object.entries(request.body).filter(([key, value]) => value != null) );
    
    updateAddress.updatedAt = new Date();
    
    let document = db.collection('users').doc(userID).collection('addresses')
    .doc(`${request.params.addressID}`);
    document.get()
    .then(async (doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ message: 'Alamat tidak ditemukan' })
        }
    })
    .catch((err) => {
        return response.status(404).json({ message: 'Alamat tidak ditemukan' })
    });

    document.update(updateAddress)
    .then(()=> {
        updateAddress.addressID = request.params.addressID;
        return response.json({message: 'Updated successfully',data:updateAddress});
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ 
                error: err 
        });
    });
}

exports.updateMainAddress = async (request, response) => {
    const userID = request.query.userID || request.user.uid;
    const addressID = request.params.addressID;
    
    const collectionUserAddress = db.collection('users').doc(userID).collection('addresses').where('isMainAddress','==',true)
    const snapsotCollectionUserAddress = await collectionUserAddress.get();
    const userMainAddress = snapsotCollectionUserAddress.docs.length;
    if(userMainAddress>0){
        const newAddress = {isMainAddress:false};
        await snapsotCollectionUserAddress.docs.forEach(doc=>{
            db.collection('users').doc(userID).collection('addresses').doc(doc.id).update(newAddress)
            .catch((err) => {
                console.error(err);
                return response.status(500).json({ 
                        error: err 
                });
            });
        })
    }
    
    let document = db.collection('users').doc(userID).collection('addresses').doc(`${addressID}`);
    const newAddress = {isMainAddress:true};
    document.update(newAddress)
    .then(()=> {
        newAddress.addressID = addressID;
        return response.json({message: 'Updated successfully',data:newAddress});
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ 
                error: err 
        });
    });
}
