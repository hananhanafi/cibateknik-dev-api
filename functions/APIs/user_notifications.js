const { db } = require('../util/admin');


exports.getUserNotifications = async (request, response) => {
    const userID = request.params.userID || request.user.uid;
    const queryRequest = request.query;
    const limit = queryRequest.limit ? parseInt(queryRequest.limit) : 10;

    const collectionUserNotification = db.collection('users').doc(userID).collection('notifications')
    
    //query get all data for counting total data
    let queryGetAll = collectionUserNotification.orderBy('createdAt','desc')
    let queryGetData = collectionUserNotification.orderBy('createdAt','desc').limit(limit);

    const snapshot = await queryGetAll.get();
    const total = snapshot.docs.length;
    const first_page = 1;
    const last_page = Math.ceil(total/limit);
    const current_page = queryRequest.page ? queryRequest.page : 1;

    let first_index = total > 0 ? 1 : 0 ;
    let last_index = total > limit ? limit : total;

    if(current_page>1){
        const first = collectionUserNotification
        .orderBy('createdAt','desc')
        .limit((limit*current_page)-limit);
        const snapshotFirst = await first.get();
        const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
        
        queryGetData = collectionUserNotification
        .orderBy('createdAt','desc')
        .startAfter(last.data().createdAt)
        .limit(limit)

        const snapshot = await queryGetData.get();
        first_index = ((limit*current_page)-(limit-1));
        last_index = first_index + snapshot.docs.length-1;
    }

    queryGetData.get()
    .then((docs)=>{
        let userNotifications={
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
            userNotifications.data.push({
                id:doc.id,
                ...doc.data(),
            })
        })
        return response.json(userNotifications);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
}

exports.getUserUnreadNotifications = async (request, response) => {
    const userID = request.params.userID || request.user.uid;
    const collectionUserNotification = db.collection('users').doc(userID).collection('notifications')
    
    collectionUserNotification.where('isRead','==',false).orderBy('createdAt','desc').get()
    .then((docs) => {
        let notifications = [];
        docs.forEach((doc) => {
            notifications.push({
                id:doc.id,
                ...doc.data()
            });
        });
        return response.json(notifications);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
}


exports.userNotificationSetRead = async (request, response) => {
    const userID = request.params.userID || request.user.uid;
    const notificationID = request.params.notificationID;
    const docUserNotification = db.collection('users').doc(userID).collection('notifications').doc(notificationID)
    
    const newNotificationSetRead={
        isRead: true
    }

    docUserNotification.update(newNotificationSetRead)
    .then((docs) => {
        return response.json({message:"Notifikasi user berhasil!"});
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
}


exports.userAllNotificationSetRead = async (request, response) => {
    const userID = request.params.userID || request.user.uid;
    
    const newNotificationSetRead={
        isRead: true
    }

    db.collection('users').doc(userID).collection('notifications').where('isRead','==',false).get()
    .then(function(querySnapshot) {
        // Once we get the results, begin a batch
        var batch = db.batch();

        querySnapshot.forEach(function(doc) {
            // For each doc, add a delete operation to the batch
            batch.update(doc.ref,newNotificationSetRead);
        });

        // Commit the batch
        return batch.commit();
    }).then(function() {
        // Delete completed!
        // ...
        return response.json({message:"Notifikasi user berhasil!"});
        
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
}


exports.deleteOneUserNotification = (request, response) => {
    const userID = request.params.userID || request.user.uid;

    const document = db.doc(`/users/${userID}/notifications/${request.params.notificationID}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ error: 'Pesan tidak ditemukan' })
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