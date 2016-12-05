const db = require('sqlite')
const bcrypt = require('bcryptjs')

module.exports = {
  get: (userId) => {                                                      //Récupère un User avec ses informations, grâce à son ID
    return db.get('SELECT rowid, * FROM users WHERE rowid = ?', userId)
  },

  getAll: (limit, offset) => {                                                    //Récupère tous les users, en fonction de la limite qui est passé en paramètre
    return db.all('SELECT rowid, * FROM users LIMIT ? OFFSET ?', limit, offset)
  },

  getByPseudo: (pseudo) => {                                                      //Récupère un User avec ses informations, grâce à son pseudo
    return db.get('SELECT rowid, * FROM users WHERE pseudo = ?', pseudo)
  },

  getId: (token) => {                                                             //Récupère l'ID de l'utilisateur connecté
    return Session.exists(accessToken).then((result) => {return result.userId})
  },

  count: () => {                                              //Compte le nombre d'utilisateur
    return db.get('SELECT COUNT(*) as count FROM users')
  },

  insert: (params) => {                                       //Insère un utilisateur dans la base de donnée
    let hash = bcrypt.hashSync(params.password)               //Fonction pour hash le mot de passe.
    return db.run(
      'INSERT INTO users (pseudo, email, password, firstname, createdAt) VALUES (?, ?, ?, ?, ?)',
      params.pseudo,
      params.email,
      hash,
      params.firstname,
      Date.now()
    )
  },

  update: (userId, params) => {                               //Fonction modifiant un utilisateur
    let hash = bcrypt.hashSync(params.password)
    const POSSIBLE_KEYS = [ 'pseudo', 'email', 'password', 'firstname' ]

    let dbArgs = []
    let queryArgs = []

    for (key in params) {
      if (-1 !== POSSIBLE_KEYS.indexOf(key)) {
        queryArgs.push(`${key} = ?`)
        dbArgs.push(params[key])
      }
    }

    // queryArgs.push('updatedAt = ?')
    // dbArgs.push(Date.now())

    if (!queryArgs.length) {
      let err = new Error('Bad request')
      err.status = 400
      return Promise.reject(err)
    }

    dbArgs.push(userId)

    let query = 'UPDATE users SET ' + queryArgs.join(', ') + ' WHERE rowid = ?'

    //db.run.apply(db, query, dbArgs)
    return db.run(query, dbArgs).then((stmt) => {
      // Ici je vais vérifier si l'update a bien changé une ligne en base
      // Dans le cas contraire, cela voudra dire qu'il n'y avait pas d'utilisateur
      // Avec db.run, la paramètre passé dans le callback du then, est le `statement`
      // qui contiendra le nombre de lignes éditées en base

      // Si le nombre de lignes dans la table mis à jour est de 0
      if (stmt.changes === 0) {
        let err = new Error('Not Found')
        err.status = 404
        return Promise.reject(err)
      }

      // Tout va bien, on retourne le stmt au prochain then, on fait comme si de rien n'était
      return stmt
    })
  },

  remove: (userId) => {                                           //Supprime un utilisateur grâce à son ID
    return db.run('DELETE FROM users WHERE rowid = ?', userId)
  }
}