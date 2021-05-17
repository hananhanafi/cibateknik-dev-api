const { db } = require('../util/admin');

exports.getAllAdminNotifications = async (request, response) => {
    
    const queryRequest = request.query;
    const limit = queryRequest.limit ? parseInt(queryRequest.limit) : 10;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    
    //query get all data for counting total data
    let queryGetAll = db.collection('admin_notifications')
    .orderBy('createdAt',order)

    let queryGetData = db.collection('admin_notifications')
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
        const first = db.collection('admin_notifications')
        .orderBy('createdAt',order)
        .limit((limit*current_page)-limit);
        const snapshotFirst = await first.get();
        const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
        
        queryGetData = db.collection('admin_notifications')
        .orderBy('createdAt',order)
        .startAfter(last.data().createdAt)
        .limit(limit)

        const snapshot = await queryGetData.get();
        first_index = ((limit*current_page)-(limit-1));
        last_index = first_index + snapshot.docs.length-1;
    }

    queryGetData
		.get()
		.then((data) => {
			let notifications = {
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
                notifications.data.push(appObj);
			});
			return response.json(notifications);
		})
		.catch((err) => {
			console.error(err);
			return response.status(500).json({ error: err.code});
		});
};


exports.getAdminUnreadNotifications = async (request, response) => {
    const collectionAdminNotification = db.collection('admin_notifications');
    
    collectionAdminNotification.where('isRead','==',false).orderBy('createdAt','desc').get()
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


exports.adminNotificationSetRead = async (request, response) => {
    const notificationID = request.params.notificationID;
    const docAdminNotification = db.collection('admin_notifications').doc(notificationID);
    
    const newNotificationSetRead={
        isRead: true
    }

    docAdminNotification.update(newNotificationSetRead)
    .then(() => {
        return response.json({message:"Notifikasi admin berhasil!"});
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });

}


exports.adminAllNotificationSetRead = async (request, response) => {
    
    const newNotificationSetRead={
        isRead: true
    }

    db.collection('admin_notifications').where('isRead','==',false).get()
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
        return response.json({message:"Notifikasi admin berhasil!"});
        
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });

}

exports.postOneadminNotification = (request, response) => {
    if(request.body.title.trim() === '') {
        return response.status(400).json({ title: 'Must not be empty' });
    }
    
	if (request.body.body.trim() === '') {
		return response.status(400).json({ body: 'Must not be empty' });
    }
    const dateNow = new Date();
    
    
    const newNotification = {
        data: {
            name: request.body.name || '',
            email: request.body.email || '',
        },
        title: request.body.title,
        description: request.body.body,
        notification_type:'message',
        createdAt: dateNow,
        updatedAt: dateNow,
    }
    db
        .collection('admin_notifications')
        .add(newNotification)
        .then((doc)=>{
            const responsedNotification = newNotification;
            responsedNotification.id = doc.id;
            return response.json(responsedNotification);
        })
        .catch((err) => {
			response.status(500).json({ error: 'Something went wrong' });
			console.error(err);
		});
};


exports.deleteOneAdminNotification = (request, response) => {
    const document = db.doc(`/admin_notifications/${request.params.notificationID}`);
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