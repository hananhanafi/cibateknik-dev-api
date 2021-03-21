const { admin, db, firebase } = require('../util/admin');

const { validateLoginData, validateSignUpData } = require('../util/validators');

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
            
            const isVerified = await firebase.auth().currentUser.emailVerified;

            if(!isVerified){
                return response.status(403).json({ message: 'Please verify your account'});
            }
            return data.user.getIdToken();
        })
        .then((token) => {
            return response.json({ token });
        })
        .catch((error) => {
            console.error(error);
            return response.status(403).json({ error:error,message: 'wrong credentials, please try again'});
        })
};

exports.signUpUser = (request, response) => {
    const newUser = {
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        phoneNumber: request.body.phoneNumber,
        address: request.body.address,
		password: request.body.password,
		confirmPassword: request.body.confirmPassword,
		username: request.body.username,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const { valid, errors } = validateSignUpData(newUser);

	if (!valid) return response.status(400).json(errors);

    let token, userID;
    db
        .doc(`/users/${newUser.username}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                return response.status(400).json({ username: 'this username is already taken' });
            } else {
                return firebase
                        .auth()
                        .createUserWithEmailAndPassword(
                            newUser.email, 
                            newUser.password
                    );
            }
        })
        .then((data) => {
            userID = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idtoken) => {
            token = idtoken;
            const userCredentials = {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                username: newUser.username,
                phoneNumber: newUser.phoneNumber,
                address: newUser.address,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userID
            };
            // return db
            //         .doc(`/users/${newUser.username}`)
            //         .set(userCredentials);
            db
            .doc(`/users/${newUser.username}`)
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
exports.uploadProfilePhoto = (request, response) => {
    const BusBoy = require('busboy');
	const path = require('path');
	const os = require('os');
	const fs = require('fs');
	const busboy = new BusBoy({ headers: request.headers });

	let imageFileName;
	let imageToBeUploaded = {};

	busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
		if (mimetype !== 'image/png' && mimetype !== 'image/jpeg') {
			return response.status(400).json({ error: 'Wrong file type submited' });
		}
		const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${request.user.username}.${imageExtension}`;
		const filePath = path.join(os.tmpdir(), imageFileName);
		imageToBeUploaded = { filePath, mimetype };
		file.pipe(fs.createWriteStream(filePath));
    });
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
				return db.doc(`/users/${request.user.username}`).update({
					imageUrl
				});
			})
			.then(() => {
				return response.json({ message: 'Image uploaded successfully' });
			})
			.catch((error) => {
				console.error(error);
				return response.status(500).json({ error: error.code });
			});
	});
	busboy.end(request.rawBody);
};

exports.getUserDetail = (request, response) => {
    let userData = {};

    // return response.json(firebase.auth().currentUser.emailVerified);

	db
		.doc(`/users/${request.user.username}`)
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

exports.updateUserDetails = (request, response) => {

    
    let updateItem = Object.fromEntries(
        Object.entries(request.body).filter(([key, value]) => value != null) );
    
    updateItem.updatedAt = new Date();
    
    let document = db.collection('users').doc(`${request.user.username}`);

    var user = firebase.auth().currentUser;

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
    .then(()=> {
        response.json({message: 'Updated successfully'});
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