const { admin, db } = require('./admin');

module.exports = (request, response, next) => {
	let idToken;
	if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
		idToken = request.headers.authorization.split('Bearer ')[1];
	} else {
		console.error('No token found');
		return response.status(403).json({ error: 'Unauthorized' });
	}
	let checkRevoked = true;
	admin
		.auth()
		.verifyIdToken(idToken, checkRevoked)
		.then((decodedToken) => {
			request.user = decodedToken;
			return db.collection('users').where('userID', '==', request.user.uid).limit(1).get();
		})
		.then((data) => {
			// request.user.username = data.docs[0].data().username;
			request.user.photoURL = data.docs[0].data().photoURL;
			return next();
		})
		.catch((error) => {
			if (error.code == 'auth/id-token-expired') {
			  // Token has been revoked. Inform the user to reauthenticate or signOut() the user.
				return response.status(401).json(error);
			} 
			else if (error.code == 'auth/id-token-revoked') {
			  // Token has been revoked. Inform the user to reauthenticate or signOut() the user.
				return response.status(401).json(error);
			} else {
				console.error('Error while verifying token', error);
				return response.status(403).json(error);
			}
		});
};