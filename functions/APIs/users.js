const { admin, db, firebase } = require('../util/admin');
const config = require('../util/config');
const { createSubstringArray } = require('../util/helpers');

const { validateLoginData, validateSignUpData } = require('../util/validators');


exports.getAllUsers = async (request, response) => {
    const queryRequest = request.query;
    const order = queryRequest.order == 'asc' ? 'asc' : 'desc';
    const search = queryRequest.search;
    const limit = queryRequest.limit ? queryRequest.limit : 10;
    //query get all data for counting total data
    let queryGetAll = db.collection('users').orderBy('createdAt', order);
    
    //query get limited data for pagination
    let queryGetData = db.collection('users')
    .orderBy('createdAt', order)
    .limit(limit);
    
    if(search){
        queryGetAll = db.collection('users')
        .orderBy('createdAt', order)
        .where("searchKeywordsArray", "array-contains", search.toLowerCase())

        queryGetData = db.collection('users')
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
            const first = db.collection('users')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];

            queryGetData = db.collection('users')
            .where("searchKeywordsArray", "array-contains", search.toLowerCase())
            .orderBy('createdAt', order)
            .startAfter(last.data().createdAt)
            .limit(limit)
        }else{
            const first = db.collection('users')
            .orderBy('createdAt', order)
            .limit((limit*current_page)-limit);
            const snapshotFirst = await first.get();
            const last = snapshotFirst.docs[snapshotFirst.docs.length - 1];
            
            queryGetData = db.collection('users')
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
        let users = {
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
            users.data.push({
                userID: doc.id,
                firstName: doc.data().firstName,
                lastName: doc.data().lastName,
                email: doc.data().email,
                address: doc.data().address,
                phoneNumber: doc.data().phoneNumber,
                createdAt: doc.data().createdAt,
                updatedAt: doc.data().updatedAt,
                lastLogin: doc.data().lastLogin || doc.data().updatedAt,
            });
        });
        return response.json(users);
    })
    .catch((err) => {
        console.error(err);
        return response.status(500).json({ error: err});
    });
};

exports.getToken = (request, response) => {
    const user = firebase.auth().currentUser;

    if (user != null) {
        user.getIdTokenResult(true).then(token => {
          //handle token
            return response.json({ token });
        })
        .catch((error) => {
            console.error(error);
            return response.status(403).json({ error:error,message: 'wrong credentials, please try again'});
        })
    }
}


// Login
exports.loginUser = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    }

    const { valid, errors } = validateLoginData(user);
	if (!valid) return response.status(400).json(errors);

    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then(async(data) => {
            
            // const isVerified = await firebase.auth().currentUser.emailVerified;

            // if(!isVerified){
            //     return response.status(403).json({ message: 'Please verify your account'});
            // }

            console.log("DATUS",data.user.uid);
            
            db.collection('users').doc(`${data.user.uid}`).update({lastLogin:new Date()})
            // return data.user.getIdToken(true);
            return data.user.getIdTokenResult(true);
        })
        .then((token) => {
            console.log("token",token);
            return response.json({ token });
        })
        .catch((error) => {
            console.error(error);
            return response.status(403).json({ error:error,message: 'wrong credentials, please try again'});
        })
};

exports.signUpUser = async (request, response) => {
    const newUser = {
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        phoneNumber: request.body.phoneNumber,
        address: request.body.address,
		password: request.body.password,
		confirmPassword: request.body.confirmPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const { valid, errors } = validateSignUpData(newUser);

	if (!valid) return response.status(400).json(errors);

    const fullName = newUser.firstName + " " + newUser.lastName;
    const searchKeywordsArray = await createSubstringArray(fullName);
    newUser.searchKeywordsArray = searchKeywordsArray;


    let token, userID;

    firebase
    .auth()
    .createUserWithEmailAndPassword(
        newUser.email, 
        newUser.password
    ).then((data) => {
        userID = data.user.uid;
        return data.user.getIdToken();
    })
    .then((idtoken) => {
        token = idtoken;
        const userCredentials = {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phoneNumber: newUser.phoneNumber,
            address: newUser.address,
            email: newUser.email,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt,
            searchKeywordsArray: newUser.searchKeywordsArray,
            userID
        };
        // return db
        //         .doc(`/users/${newUser.username}`)
        //         .set(userCredentials);
        db
        .doc(`/users/${userCredentials.userID}`)
        .set(userCredentials);

        return firebase.auth().currentUser;
    })
    .then((user)=>{
        user.sendEmailVerification().then(function() {
            return response.status(201).json({ token });
            // Email sent.
        }).catch(function(error) {
            return response.status(500).json({ error: error });
        });
    })
    .catch((err) => {
        console.error(err);
        if (err.code === 'auth/email-already-in-use') {
            return response.status(400).json({ email: 'Email already in use' });
        } else {
            return response.status(500).json({ general: 'Something went wrong, please try again' });
        }
    });
}

deleteImage = (imageName) => {
    const bucket = admin.storage().bucket();
    const path = `${imageName}`
    return bucket.file(path).delete()
    .then(() => {
        return
    })
    .catch((error) => {
        return
    })
}

// Upload profile picture
exports.uploadProfilePhoto = async (request, response) => {
    const BusBoy = require('busboy');
	const path = require('path');
	const os = require('os');
	const fs = require('fs');
	const busboy = new BusBoy({ headers: request.headers });

	let imageFileName;
	let imageToBeUploaded = {};

    try {
        await busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            if (mimetype !== 'image/png' && mimetype !== 'image/jpeg') {
                return response.status(400).json({ error: 'Wrong file type submited' });
            }
            const imageExtension = filename.split('.')[filename.split('.').length - 1];
            imageFileName = `${request.user.uid}.${imageExtension}`;
            const filePath = path.join(os.tmpdir(), imageFileName);
            imageToBeUploaded = { filePath, mimetype };
            file.pipe(fs.createWriteStream(filePath));
        });
    }catch (error){
        return response.status(500).json({ general: 'Something went wrong, please try again' });
    }

    deleteImage(imageFileName);
	busboy.on('finish', () => {
		admin
			.storage()
			.bucket()
			.upload(imageToBeUploaded.filePath, {
				resumable: false,
				metadata: {
					metadata: {
						contentType: imageToBeUploaded.mimetype
					}
				}
			})
			.then(() => {
				const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;

				return db.doc(`/users/${request.user.uid}`).update({
					imageUrl
				});
			})
			.then(() => {
				return response.json({ message: 'Image uploaded successfully' });
			})
			.catch((error) => {
				console.error(error);
				return response.status(500).json({ error: error });
			});
	});
	busboy.end(request.rawBody);
};

exports.getUserDetail = (request, response) => {
    let userData = {};

    // return response.json(firebase.auth().currentUser.emailVerified);

	db
		.doc(`/users/${request.user.uid}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
                userData.userCredentials = doc.data();
                return response.json(userData);
			}	
		})
		.catch((error) => {
			console.error(error);
			return response.status(500).json({ error: error.code });
		});
}

exports.updateUserDetails = async (request, response) => {

    
    let updateItem = Object.fromEntries(
        Object.entries(request.body).filter(([key, value]) => value != null) );
    
    updateItem.updatedAt = new Date();
    
    let document = db.collection('users').doc(`${request.user.uid}`);

    var user = firebase.auth().currentUser;

        
    const fullName = updateItem.firstName + " " + updateItem.lastName;
    const searchKeywordsArray = await createSubstringArray(fullName);
    updateItem.searchKeywordsArray = searchKeywordsArray;

    if(updateItem.email){
        user.updateEmail(updateItem.email).then(function() {
        // Update successful.
        }).catch(function(error) {
        // An error happened.
        });
            
    }
    if(updateItem.passsword){
        user.updatePassword(updateItem.email).then(function() {
        // Update successful.
        }).catch(function(error) {
        // An error happened.
        });
            
    }

    document.update(updateItem)
    .then((data)=> {
        // response.json({message: 'Updated successfully'});
        return document.get();
    })
    .then((doc) => {
        let userData = {};
        if (doc.exists) {
            userData.userCredentials = doc.data();
            return response.json(userData);
        }	
    })
    .catch((error) => {
        console.error(error);
        return response.status(500).json({ 
            message: "Cannot Update the value"
        });
    });
}



exports.sendVerificationEmail = (request, response) => {
    var auth = firebase.auth().user;
    var emailAddress = request.body.email;

    auth.sendEmailVerification(emailAddress).then(function() {
        // Email sent.
    return response.status(201).json({ message:"Send email success" });
    }).catch(function(error) {
        // An error happened.
        return response.status(500).json({ error: error.code });
    });
}

exports.sendEmailResetPassword = (request, response) => {
    var auth = firebase.auth();
    var emailAddress = request.body.email;

    auth.sendPasswordResetEmail(emailAddress).then(function() {
        // Email sent.
    return response.status(201).json({ message:"Send email success" });
    }).catch(function(error) {
        // An error happened.
        return response.status(500).json({ error: error.code });
    });
}