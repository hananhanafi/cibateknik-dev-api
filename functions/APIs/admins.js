const { db } = require('../util/admin');

const firebase = require('firebase');


const isEmpty = (string) => {
	if (string == undefined || string.trim() === '') return true;
	else return false;
};

const validateLoginData = (data) => {
    let errors = {};
    if (isEmpty(data.email)) errors.email = 'Must not be empty';
    if (isEmpty(data.password)) errors.password = 'Must not be  empty';
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    };
};

const isEmail = (email) => {
	const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if (email.match(emailRegEx)) return true;
	else return false;
};

const validateSignUpData = (data) => {
	let errors = {};

	if (isEmpty(data.email)) {
		errors.email = 'Must not be empty';
	} else if (!isEmail(data.email)) {
		errors.email = 'Must be valid email address';
	}

	if (isEmpty(data.password)) errors.password = 'Must not be empty';
	if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passowrds must be the same';
	if (isEmpty(data.username)) errors.username = 'Must not be empty';

	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false
	};
};

// Login
exports.loginAdmin = (request, response) => {
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

exports.signUpAdmin = (request, response) => {
    const newAdmin = {
		username: request.body.username,
        email: request.body.email,
		password: request.body.password,
		confirmPassword: request.body.confirmPassword,
    };

    const { valid, errors } = validateSignUpData(newAdmin);

	if (!valid) return response.status(400).json(errors);

    let token, adminId;
    db.doc(`/admins/${newAdmin.username}`)
    .get()
    .then((doc) => {
        if (doc.exists) {
            return response.status(400).json({ username: 'this username is already taken' });
        } else {
            return firebase
                    .auth()
                    .createUserWithEmailAndPassword(
                        newAdmin.email, 
                        newAdmin.password
                );
        }
    })
    .then((data) => {
        adminId = data.user.uid;
        return data.user.getIdToken();
    })
    .then((idtoken) => {
        token = idtoken;
        const userCredentials = {
            username: newAdmin.username,
            email: newAdmin.email,
            createdAt: new Date().toISOString(),
            adminId
        };
        return db
                .doc(`/admins/${newAdmin.username}`)
                .set(userCredentials);
    })
    .then(()=>{
        return response.status(201).json({ token });
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
