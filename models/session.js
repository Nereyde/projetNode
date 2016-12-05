const Redis = require('ioredis')			//Appelle de Redis
const redis = new Redis()

module.exports = {
	add: (userId, token) => {				//Fonction de création d'une session
		var createdAt = Date.now()
  		var expiresAt = (Date.now() + 3600000)		//Expire 3 600 000ms après la date de la création, soit 1 heure après.
  		return redis.hmset('token:'+token, 'userId', userId, 'createdAt', createdAt, 'expiresAt', expiresAt)
	},

	exists: (accessToken) => {							//Fonction renvoyant tous les paramètres pour un Token passé en paramètre
		return redis.hgetall('token:'+accessToken)
	},

	getToken: (req) => {								//récupère l'access Token de la session actuelle
		var accessToken = req.cookies.accessToken
		if (!accessToken) accessToken = req.headers['x-accesstoken']
		return accessToken
	},

	getUserId: (accessToken) => {						//Récupère l'ID du User actuellement connecté
		return redis.hgetall('token:'+accessToken).then((result) => {return result.userId})
	}
}