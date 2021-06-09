const { db, firebase } = require('../util/admin');
const { validateLoginData, validateSignUpAdmin } = require('../util/validators');

// Login admin
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
            return data.user.getIdTokenResult(true);
        })
        .then((token) => {
            return response.json({ token });
        })
        .catch((error) => {
            console.error(error);
            return response.status(403).json({ 
                error:error,
                message: 'Email atau password salah!'
            });
        })
};


exports.signUpAdmin = (request, response) => {
    const newAdmin = {
		username: request.body.username,
        email: request.body.email,
		password: request.body.password,
		confirmPassword: request.body.confirmPassword,
    };

    const { valid, errors } = validateSignUpAdmin(newAdmin);

	if (!valid) return response.status(400).json(errors);

    let token, adminID;
    db.doc(`/admins/${newAdmin.username}`)
    .get()
    .then((doc) => {
        if (doc.exists) {
            return response.status(400).json({ username: 'Username sudah terdaftar' });
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
        adminID = data.user.uid;
        return data.user.getIdToken();
    })
    .then((idtoken) => {
        token = idtoken;
        const userCredentials = {
            username: newAdmin.username,
            email: newAdmin.email,
            createdAt: new Date().toISOString(),
            adminID
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
            return response.status(400).json({ email: 'Email sudah terdaftar' });
        } else {
            return response.status(500).json({ general: 'Something went wrong, please try again' });
        }
    });
}
