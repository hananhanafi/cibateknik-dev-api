const { db } = require('../util/admin');
exports.getTotalData = async (request, response) => {

    try{

        const total= {
            order: 0,
            revenue: 0,
            users: 0
        }
        const snapshotOrder = await db.collection('users_order').where('statusOrder','!=','EXPIRED').get();
        total.order = snapshotOrder.docs.length;
        
        const snapshotRevenue = await db.collection('users_order').where('invoice.status','==','PAID').get();
        
        let totalRevenue = 0;
        snapshotRevenue.docs.forEach((order)=>{
            totalRevenue = totalRevenue + order.data().amount;
        })
        total.revenue = totalRevenue;
        
        
        const snapshotUsers = await db.collection('users').get();
        total.users = snapshotUsers.docs.length;
        
        
        return response.json(total);
    }
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }

    
};


exports.getTodayData = async (request, response) => {

    try{
        const data = {
            todayOrder: 0,
            todayRevenue: 0,
            usersOnline: 0
        }
        const dateYesterday = new Date(request.query.dateYesterday);
        const dateTomorrow = new Date(request.query.dateTomorrow);
        dateYesterday.setHours(0,0,0,0);
        dateTomorrow.setHours(0,0,0,0);
        
        const snapshotUsersOnline = await db.collection('users').where('isLogin','==',true).get();
        data.usersOnline = snapshotUsersOnline.docs.length;
        

        const snapshotTodayOrder = await db.collection('users_order').orderBy('createdAt','desc').where('createdAt','>',dateYesterday).where('createdAt','<',dateTomorrow).get();
        data.todayOrder = snapshotTodayOrder.docs.length;
        

        const snapshotTodayOrderRevenye = await db.collection('users_order').where('isPaid','==',true).where('paidAt','>',dateYesterday).where('paidAt','<',dateTomorrow).get();

        let totalToadyRevenue = 0;
        snapshotTodayOrderRevenye.docs.forEach((order)=>{
            totalToadyRevenue = totalToadyRevenue + order.data().amount;
        })
        data.todayRevenue = totalToadyRevenue;

        
        return response.json(data);
    }
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
};



exports.getPaidOrderByRangeDate = async (request, response) => {

    try{
        const fromDate = new Date(request.query.fromDate);
        const toDate = new Date(request.query.toDate);
        fromDate.setHours(0,0,0,0);
        toDate.setHours(0,0,0,0);


        const data = {
            data: []
        }
        const snapshotOrderRevenue = await db.collection('users_order').where('isPaid','==',true).where('paidAt','<',toDate).where('paidAt','>',fromDate).get();
        snapshotOrderRevenue.docs.forEach((doc)=>{
            data.data.push({
                id:doc.id,
                ...doc.data(),
            })
        })

        return response.json(data);
    }
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
};



exports.getOrderByRangeDate = async (request, response) => {

    try{
        const fromDate = new Date(request.query.fromDate);
        const toDate = new Date(request.query.toDate);
        fromDate.setHours(0,0,0,0);
        toDate.setHours(0,0,0,0);

        const data = {
            data: []
        }
        const snapshotOrder = await db.collection('users_order').where('createdAt','<',toDate).where('createdAt','>',fromDate).get();
        snapshotOrder.docs.forEach((doc)=>{
            data.data.push({
                id:doc.id,
                ...doc.data(),
            })
        })
        

        return response.json(data);
    }
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
};

exports.getTopSellingItem = async (request, response) => {

    try{

        const data = [];

        const snapshotTopSellingItem = await db.collection('items_posted').orderBy('itemSold','desc').limit(10).get();
        snapshotTopSellingItem.docs.forEach((doc)=>{
            if(doc.data().itemSold){
                data.push({
                    id:doc.id,
                    ...doc.data(),
                })
            }
        })

        return response.json(data);
    }
    catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
};