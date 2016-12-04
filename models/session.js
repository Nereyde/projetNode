const Redis = require('ioredis')
const redis = new Redis()

module.exports = {
	add: (userId, token) => {
		var createdAt = Date.now()
  		var expiresAt = (Date.now() + 3600000)
  		return redis.hmset('token:'+token, 'userId', userId, 'createdAt', createdAt, 'expiresAt', expiresAt)
	},

	exists: (accessToken) => {
		return redis.hgetall('token:'+accessToken)
	},

	getToken: (req) => {
		var accessToken = req.cookies.accessToken
		if (!accessToken) accessToken = req.headers['x-accesstoken']
		return accessToken
	},

	getUserId: (accessToken) => {
		return redis.hgetall('token:'+accessToken).then((result) => {return result.userId})
	}
}