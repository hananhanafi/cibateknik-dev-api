const { db } = require('../util/admin');

exports.getAllAdminMessages = async (request, response) => {
    
    const queryRequest = request.query;
    const limit = queryRequest.limit ? parseInt(queryRequest.limit) : 2;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    
    //query get all data for counting total data
    let queryGetAll = db.collection('admin_messages')
    .orderBy('createdAt',order)

    let queryGetData = db.collection('admin_messages')
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
        const first = db.collection('admin_messages')
        .orderBy('createdAt',order)
        .limit((limit*current_page)-limit);
        const snapshotFirst = await first.get();
        const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
        
        queryGetData = db.collection('admin_messages')
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
			let messages = {
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
                messages.data.push(appObj);
			});
			return response.json(messages);
		})
		.catch((err) => {
			console.error(err);
			return response.status(500).json({ error: err.code});
		});
};

exports.postOneadminMessage = (request, response) => {
    if(request.body.title.trim() === '') {
        return response.status(400).json({ title: 'Must not be empty' });
    }
    
	if (request.body.body.trim() === '') {
		return response.status(400).json({ body: 'Must not be empty' });
    }
    const dateNow = new Date();
    
    
    const newMessage = {
        name: request.body.name || '',
        email: request.body.email || '',
        title: request.body.title,
        body: request.body.body,
        createdAt: dateNow,
    }
    db
        .collection('admin_messages')
        .add(newMessage)
        .then((doc)=>{
            const responsedMessage = newMessage;
            responsedMessage.id = doc.id;
            return response.json(responsedMessage);
        })
        .catch((err) => {
			response.status(500).json({ error: 'Something went wrong' });
			console.error(err);
		});
};


exports.deleteOneAdminMessage = (request, response) => {
    const document = db.doc(`/admin_messages/${request.params.messageID}`);
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