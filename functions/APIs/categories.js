const { db } = require('../util/admin');
const { createSubstringArray } = require('../util/helpers');


exports.getAllCategories= async (request, response) => {
    const queryRequest = request.query;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    const search = queryRequest.search;
    const limit = queryRequest.limit ? queryRequest.limit : 10;

    //query get all data for counting total data
    let queryGetAll = db.collection('categories').orderBy('createdAt', order);
    
    //query get limited data for pagination
    let queryGetData = db.collection('categories')
    .orderBy('createdAt', order)
    .limit(limit);
    
    if(search){
        queryGetAll = db.collection('categories')
        .orderBy('createdAt', order)
        .where("searchKeywordsArray", "array-contains", search.toLowerCase())

        queryGetData = db.collection('categories')
        .orderBy('createdAt', order)
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
            const first = db.collection('categories')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];

            queryGetData = db.collection('categories')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .startAfter(last.data().createdAt)
            .limit(limit)
        }else{
            const first = db.collection('categories')
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
            
            queryGetData = db.collection('categories')
            .orderBy('createdAt', order)
            .startAfter(last.data().createdAt)
            .limit(limit)
        }

        const snapshot = await queryGetData.get();
        first_index = ((limit*current_page)-(limit-1));
        last_index = first_index + snapshot.docs.length-1;
    }

    queryGetData.get()
    .then((data) => {
        let categories = {
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
            categories.data.push({
                categoryID: doc.id,
                categoryUID: doc.data().categoryUID,
                name: doc.data().name,
                createdAt: doc.data().createdAt,
                updatedAt: doc.data().updatedAt,
            });
        });
        return response.json(categories);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
};

exports.postOneCategory = async (request, response) => {

    try {
        
        if (request.body.name == undefined || request.body.name.trim() === '') {
            return response.status(400).json({ name: 'Must not be empty' });
        }
        const res = request.body.name.toLowerCase().split(" ");
        const nameArr = res.filter(item=>{
            return item!="";
        })

        const categoryUID = nameArr.join("-");

        const newCategory = {
            categoryUID: categoryUID,
            name: request.body.name,
            createdAt: new Date(),
            updatedAt: new Date(),

        }

        
        const searchKeywordsArray = await createSubstringArray(newCategory.name);
        newCategory.searchKeywordsArray = searchKeywordsArray;

        const categoriesRef = db.collection('categories');
        const category = await categoriesRef.where('name', '==', newCategory.name).limit(1).get();

        if(category.empty){
            db
            .collection('categories')
            .add(newCategory)
            .then((doc)=>{
                const responseCategory = newCategory;
                delete responseCategory.searchKeywordsArray;
                responseCategory.id = doc.id;
                return response.json(responseCategory);
            })
            .catch((err) => {
                response.status(500).json({ message: 'Something went wrong' });
                console.error(err);
            });

        }else{
            return response.status(400).json({ message: 'Category already exists' });
        }
        
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: error });
    }
};

exports.getOneCategory = (request, response) => {
    const document = db.doc(`/categories/${request.params.categoryID}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ message: 'Category not found' })
            }

            
			if (doc.exists) {
                categoryData = doc.data();
                return response.json(categoryData);
			}	
        })
        .catch((err) => {
            console.error(err);
            return response.status(500).json({ error: err.code });
        });
};

exports.deleteCategory = (request, response) => {
    const document = db.doc(`/categories/${request.params.categoryID}`);
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return response.status(404).json({ message: 'Category not found' })
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

exports.editCategory = async ( request, response ) => { 

    let updateCategory = Object.fromEntries(
        Object.entries(request.body).filter(([key, value]) => value != null) );
    
    updateCategory.updatedAt = new Date();
    
    if (request.body.name == undefined || request.body.name.trim() === '') {
        return response.status(400).json({ name: 'Must not be empty' });
    }
    if(!request.params.categoryID){
        response.status(403).json({message: 'Not allowed to edit'});
    }
    let document = db.collection('categories').doc(`${request.params.categoryID}`);

    document.get()
    .then(async (doc)=>{
        if (!doc.exists) {
            return response.status(404).json({ message: 'Category not found' })
        }
        
        if(doc.data().name!=request.body.name){
            //check if category already exixsts
            const categoriesRef = db.collection('categories');
            const category = await categoriesRef.where('name', '==', request.body.name).limit(1).get();
            if(!category.empty){
                return response.status(400).json({ category: 'Kategori ' + request.body.name + ' sudah ada' });
            }
        }
    })
    .catch((err) => {
        return response.status(404).json({ message: 'Category not found' })
    });

    
    const res = request.body.name.toLowerCase().split(" ");
    const nameArr = res.filter(item=>{
        return item!="";
    })
    const categoryUID = nameArr.join("-");

    updateCategory.categoryUID = categoryUID;    
    updateCategory.updatedAt = new Date();
    
    const searchKeywordsArray = await createSubstringArray(updateCategory.name);
    updateCategory.searchKeywordsArray = searchKeywordsArray;


    document.update(updateCategory)
    .then(()=> {
        response.json({message: 'Updated successfully'});
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ 
                error: err.code 
        });
    });
};