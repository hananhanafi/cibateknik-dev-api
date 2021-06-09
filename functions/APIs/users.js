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
                name: doc.data().name,
                email: doc.data().email,
                phoneNumber: doc.data().phoneNumber,
                dateOfBirth: doc.data().dateOfBirth,
                photoURL: doc.data().photoURL,
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
    }else {
        return response.status(403).json({ message: 'wrong credentials, please try again'});
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
            
            db.collection('users').doc(`${data.user.uid}`).update({lastLogin:new Date(),isLogin:true});
            // return data.user.getIdToken(true);
            return data.user.getIdTokenResult(true);
        })
        .then((token) => {
            return response.json({ token });
        })
        .catch((error) => {
            console.error(error);
            return response.status(403).json({ error:error,message: 'wrong credentials, please try again'});
        })
};

exports.updatePasswordUser = async (request, response) => {
    try 
    {
        var user = await firebase.auth().currentUser;
        const providedPassword = request.body.password;
        const newPassword = request.body.newPassword;

        var credential = firebase.auth.EmailAuthProvider.credential(
            firebase.auth().currentUser.email,
            providedPassword
        );

        // Prompt the user to re-provide their sign-in credentials
        user.reauthenticateWithCredential(credential).then(function() {
            // User re-authenticated.
            user.updatePassword(newPassword).then(function() {
                // Update successful.
                return response.status(200).json({message: 'Berhasil memperbarui password' });
            }).catch(function(error) {
            // An error happened.
                return response.status(500).json({message: 'Something went wrong' });
            });
        }).catch(function(error) {
            // An error happened.
            console.log("err",error);
            return response.status(403).json({ error:error,message: 'Password lama salah!'});
        });
    } catch (error) {
        console.error(error);
        return response.status(500).json({message: 'Something went wrong' });
    }
};



// logout
exports.logoutUser = (request, response) => {
    const userID = request.params.userID || request.user.uid;
    firebase.auth().signOut().then(() => {
    // Sign-out successful.
    
    db.collection('users').doc(`${userID}`).update({isLogin:false});
    return response.json({message:'Berhasil logout'});
    }).catch((error) => {
    // An error happened.
        return response.status(403).json({ error:error,message: 'wrong credentials, please try again'});
    });
};

exports.signUpUser = async (request, response) => {
    const newUser = {
        name: request.body.name,
        email: request.body.email,
        phoneNumber: request.body.phoneNumber,
		password: request.body.password,
		confirmPassword: request.body.confirmPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const { valid, errors } = validateSignUpData(newUser);

	if (!valid) return response.status(400).json(errors);

    const searchKeywordsArray = await createSubstringArray(newUser.name);
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
            name: newUser.name,
            phoneNumber: newUser.phoneNumber,
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

exports.googleSignIn = async (request, response) => {
    const dateNow = new Date();
    const newUser = {
        userID: request.params.userID,
        name: request.body.name,
        email: request.body.email,
        phoneNumber: request.body.phoneNumber,
        photoURL: request.body.photoURL,
        createdAt: dateNow,
        updatedAt: dateNow,
    };

    const searchKeywordsArray = await createSubstringArray(newUser.name);
    newUser.searchKeywordsArray = searchKeywordsArray;

    try{
        await db
		.doc(`/users/${newUser.userID}`)
		.get()
		.then((doc) => {
			if (!doc.exists) {
                //create user doc
                db
                .doc(`/users/${newUser.userID}`)
                .set(newUser);

            }else {
                db.collection('users').doc(`${newUser.userID}`).update({lastLogin:dateNow,isLogin:true})
            }
		})
		.catch((error) => {
			console.error(error);
			return response.status(500).json({ error: error.code });
		});

        return response.status(200).json({message: 'Berhasil masuk dengan google' });
    }catch (error){
        return response.status(500).json({ general: 'Something went wrong, please try again' });
    }
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
				const photoURL = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;

				return db.doc(`/users/${request.user.uid}`).update({
					photoURL
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

exports.getUserDetail = async (request, response) => {
    let userData = {};
	db.doc(`/users/${request.user.uid}`)
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

exports.adminGetUserDetail = async (request, response) => {
    let userData = {
        data: null
    };
	db
		.doc(`/users/${request.params.userID}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
                userData.data = doc.data();
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
    const searchKeywordsArray = await createSubstringArray(updateItem.name);
    updateItem.searchKeywordsArray = searchKeywordsArray;
    
    let document = db.collection('users').doc(`${request.user.uid}`);
    document.update(updateItem)
    .then((data)=> {
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
    var user = firebase.auth().currentUser;
    user.sendEmailVerification().then(function() {
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