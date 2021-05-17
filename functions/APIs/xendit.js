const { validateEmptyData } = require("../util/validators");
const { db, fieldValue } = require('../util/admin');
const { toFormatedNumber } = require('../util/helpers');

exports.createInvoice = async (request, response) => {
    try {
        const requestBody = request.body;
        const dateNow = new Date();
        const userID = request.params.userID || request.user.uid;
        const address = requestBody.address;
        const shipment = requestBody.shipment;
        const courier = requestBody.courier;
        const amount = parseInt(requestBody.amount);

        const detailOrder = {
            items: requestBody.items,
            totalItemsWeight: requestBody.totalItemsWeight, 
            totalItemsPrice: requestBody.totalItemsPrice,
        }

        const newOrder = {
            userID,
            detailOrder,
            address,
            shipment,
            amount,
            statusOrder: 'PENDING',
            createdAt: dateNow,
            updateAt: dateNow,
        }
        newOrder.shipment.courier = courier || '';

        const collectionUsersOrder = db.collection('users_order');
        let responseOrder;
        
        const { valid, errors } = validateEmptyData(newOrder);
        if (!valid) return response.status(400).json(errors);

        await collectionUsersOrder.add(newOrder)
        .then((doc)=>{
            responseOrder = newOrder;
            responseOrder.id = doc.id;
        })
        .catch((err) => {
            response.status(500).json({ message: 'Order error' });
            console.error(err);
        });

        
        const payer_email = requestBody.payer_email || request.user.email;

        const Xendit = require('xendit-node');
        const x = new Xendit({
            secretKey: 'xnd_development_3hOf2OVfDtLYAbNiAiY3j9ubonAwpn2LOR9een880EAxJbBPTE4kfjtoQo18O5',
        });
        

        const { Invoice } = x;
        const invoiceSpecificOptions = {};
        const i = new Invoice(invoiceSpecificOptions);

        const resp = await i.createInvoice({
            externalID: responseOrder.id,
            amount: amount,
            payerEmail: payer_email,
            description: 'Invoice transaksi toko Ciba Teknik',
        });

        const documentUserOrder = collectionUsersOrder.doc(responseOrder.id);
        if(resp){
            newOrder.invoice = resp;
            // const itemOrderInCart = newOrder.detailOrder.items.map(item=>{return item.cart});
            // const documentUserCart = db.collection('users_cart').doc(userID)
            // documentUserCart.update('itemList',fieldValue.arrayRemove(...itemOrderInCart));

            documentUserOrder.update(newOrder)
            .then( async (doc)=>{

                const newNotif = {
                    createdAt: dateNow,
                    updatedAt: dateNow,
                    notification_type: 'order',
                    title: "Memesan Barang",
                    description: `Anda telah memesan barang dengan total tagihan sebesar Rp ${toFormatedNumber(amount)}, silahkan bayar pesanan Anda sebelum Invoice expired. Untuk mengecek pesanan anda dapat dilihat di menu Profil > Pesanan Saya.`,
                    data: newOrder,
                    isRead: false,
                }
                
                await db.collection('users').doc(userID).collection('notifications').add(newNotif)
                .then(()=>{
                    return;
                })
                .catch((err) => {
                    response.status(500).json({ error: 'Something went wrong' });
                    console.error(err);
                });

                

                const newAdminNotif = {
                    createdAt: dateNow,
                    updatedAt: dateNow,
                    notification_type: 'user_order',
                    title: "Pemesanan Barang",
                    description: `Customer atas nama ${newOrder.address.name} telah memesan barang dengan jumlah tagihan sebesar Rp ${toFormatedNumber(amount)}. Untuk mengetahui rincian pesanan customer dapat dilihat pada Dashboard > Daftar Pesanan.`,
                    data: newOrder,
                    isRead: false,
                }
                await db.collection('admin_notifications').add(newAdminNotif);
                
                newOrder.id = doc.id;
                return response.json({message: 'Checkout successfully',data:newOrder});
            })
            .catch((err) => {
                response.status(500).json({ message: 'Checkout error' });
                console.error(err);
            });
        }else{
            documentUserOrder.delete();
            response.status(500).json({ message: 'Checkout error' });
        }
        
            
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error,message: 'Something went wrong' });
    }

}


exports.getUserOrder = async (request, response) => {
    const userID = request.params.userID || request.user.uid;

    const queryRequest = request.query;
    const limit = queryRequest.limit ? parseInt(queryRequest.limit) : 10;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    
    //query get all data for counting total data
    let queryGetAll = db.collection('users_order')
    .where('userID','==',userID)
    .orderBy('createdAt',order)

    let queryGetData = db.collection('users_order')
    .where('userID','==',userID)
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
        const first = db.collection('users_order')
        .where('userID','==',userID)
        .orderBy('createdAt',order)
        .limit((limit*current_page)-limit);
        const snapshotFirst = await first.get();
        const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
        
        queryGetData = db.collection('users_order')
        .where('userID','==',userID)
        .orderBy('createdAt',order)
        .startAfter(last.data().createdAt)
        .limit(limit)

        const snapshot = await queryGetData.get();
        first_index = ((limit*current_page)-(limit-1));
        last_index = first_index + snapshot.docs.length-1;
    }

    queryGetData.get()
    .then((docs)=>{
        let userOrders={
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
            userOrders.data.push({
                id:doc.id,
                ...doc.data(),
            })
        })
        return response.json(userOrders);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
}



exports.updateInvoice = async (request, response) => {
    try {
        const invoice_id = request.body.id;
        const updateOrder = {
            invoice: request.body,
            statusOrder: request.body.status === 'EXPIRED' ? 'EXPIRED' : 'PACKING',
        }
        const dateNow = new Date();

        var orderItems = [];
        var userID, dataOrder;
        await db.collection('users_order')
        .where('invoice.id','==',invoice_id)
        .orderBy('createdAt', 'desc')
        .limit(1).get()
        .then((docs)=>{
            docs.forEach(doc=>{
                db.collection('users_order').doc(doc.id).update(updateOrder);
                userID = doc.data().userID;
                orderItems = doc.data().detailOrder.items;
                dataOrder = {
                    ...doc.data(),
                    ...updateOrder,
                }
            })
        })

        if(updateOrder.statusOrder !== 'EXPIRED'){
            const promises = [];
            orderItems.forEach(item=>{
                promises.push(
                    new Promise((resolve, reject) => {
                        var request = require("request");
            
                        var options = {
                            method: 'POST',
                            url: `https://us-central1-cibateknik-dev-api.cloudfunctions.net/api/product/${item.item.productID}/item/${item.item.itemID}/stock/update`,
                            headers: {'content-type': 'application/x-www-form-urlencoded'},
                            form: {
                                out: item.cart.amount,
                                in: 0,
                                description: "Barang terjual",
                                date : dateNow.getDate(),
                                month: dateNow.getMonth()+1,
                                year: dateNow.getFullYear(),
                            }
                        };
            
                        request(options, function (error, response, body) {
                            if (error) throw new Error(error);
                            result = JSON.parse(body); 
                            
                            resolve(result);
                        });
                        
                    })
                )
            })

            
            try {
                await Promise.all(promises);
                const newNotif = {
                    createdAt: dateNow,
                    updatedAt: dateNow,
                    notification_type: 'order',
                    title: "Pesanan Dibayar",
                    description: `Anda telah membayar pesanan, mohon ditunggu barang sedang dikemas dan akan segera dikirim.`,
                    data: dataOrder,
                    isRead: false,
                }
                
                await db.collection('users').doc(userID).collection('notifications').add(newNotif)
                .then(()=>{
                    return;
                })
                .catch((err) => {
                    response.status(500).json({ error: 'Something went wrong' });
                    console.error(err);
                });
                
                const newAdminNotif = {
                    createdAt: dateNow,
                    updatedAt: dateNow,
                    notification_type: 'user_order',
                    title: "Pesanan Dibayar",
                    description: `Customer atas nama ${dataOrder.address.name} telah membayar pesanan dengan tagihan sebesar ${toFormatedNumber(dataOrder.amount)}, segera lakukan pengemasan dan pengiriman sesuai dengan alamant yang tertera di rincian pesanan. Untuk mengetahui rincian pesanan customer dapat dilihat pada Dashboard > Daftar Pesanan.`,
                    data: dataOrder,
                    isRead: false,
                }
                
                await db.collection('admin_notifications').add(newAdminNotif)
                .then(()=>{
                    return;
                })
                .catch((err) => {
                    response.status(500).json({ error: 'Something went wrong' });
                    console.error(err);
                });

                return response.json({message: 'Callback successfully'});
            } 
            catch (error) {
                console.error("error ni",error);
                return response.status(500).json({ error: error });
            }
        }else {
            return response.json({message: 'Callback successfully'});
        }

            
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error,message: 'Something went wrong' });
    }

}




exports.getAllUsersOrder = async (request, response) => {
    const queryRequest = request.query;
    const limit = queryRequest.limit ? parseInt(queryRequest.limit) : 10;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    
    //query get all data for counting total data
    let queryGetAll = db.collection('users_order')
    .orderBy('createdAt',order)

    let queryGetData = db.collection('users_order')
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
        const first = db.collection('users_order')
        .orderBy('createdAt',order)
        .limit((limit*current_page)-limit);
        const snapshotFirst = await first.get();
        const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
        
        queryGetData = db.collection('users_order')
        .orderBy('createdAt',order)
        .startAfter(last.data().createdAt)
        .limit(limit)

        const snapshot = await queryGetData.get();
        first_index = ((limit*current_page)-(limit-1));
        last_index = first_index + snapshot.docs.length-1;
    }

    queryGetData.get()
    .then((docs)=>{
        let userOrders={
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
            userOrders.data.push({
                id:doc.id,
                ...doc.data(),
            })
        })
        return response.json(userOrders);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
}



exports.updateStatusOrder = async (request, response) => {
    try {
        const dateNow = new Date();
        const orderID = request.params.orderID;
        const receiptNumber = request.body.receiptNumber;
        const statusOrder = request.body.statusOrder;

        let updateOrder = {}

        if(statusOrder == 'SHIPPING'){
            updateOrder = {
                statusOrder,
                receiptNumber
            }
        }else{
            updateOrder = {
                statusOrder
            }
        }
        let dataOrder,userID;
        await db.collection('users_order').doc(orderID).get()
        .then((doc)=>{
            dataOrder = {
                id: doc.id,
                ...doc.data()
            };
            
            userID = doc.data().userID;
        })
        console.log("DAORd",dataOrder);
        
        db.collection('users_order').doc(orderID).update(updateOrder)
        .then(async(doc)=>{
            let newNotif;
            if(statusOrder == 'SHIPPING'){
                newNotif = {
                    createdAt: dateNow,
                    updatedAt: dateNow,
                    notification_type: 'order',
                    title: "Pesanan Dikirim",
                    description: `Pesanan Anda telah dikirim menggunakan jasa pengiriman ${dataOrder.shipment.courier.label} dengan estimasi ${ dataOrder.shipment.cost[0].etd.includes("HARI") || dataOrder.shipment.cost[0].etd.includes("Hari") || dataOrder.shipment.cost[0].etd.includes("hari")  ? dataOrder.shipment.cost[0].etd : dataOrder.shipment.cost[0].etd + " Hari" }.Apabila barang telah diterima mohon konfirmasi dengan menyelesaikan pesanan ini. Untuk mengecek pesanan anda dapat dilihat di menu Profil > Pesanan Saya.`,
                    data: dataOrder,
                    isRead: false,
                }
            }else{
                newNotif = {
                    createdAt: dateNow,
                    updatedAt: dateNow,
                    notification_type: 'order',
                    title: "Pesanan Dikirim",
                    description: `Pesanan Anda telah diselesaikan oleh Admin.`,
                    data: dataOrder,
                    isRead: false,
                }
                
            }
            console.log("NEWNOTIF",newNotif);
            await db.collection('users').doc(userID).collection('notifications').add(newNotif)
        });

        return response.json({message: 'Update successfully'});
            
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error,message: 'Something went wrong' });
    }

}

