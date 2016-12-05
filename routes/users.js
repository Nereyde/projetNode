//Dépendances
const router = require('express').Router()
const User = require('../models/user')

/* Users : liste */
router.get('/', (req, res, next) => {             ////La route de base va afficher tous les utilisateurs dans la BDD
  let limit = parseInt(req.query.limit) || 20
  let offset = parseInt(req.query.offset) || 0

  if (limit < 1) limit = 1
  else if (limit > 100) limit = 100

  if (offset < 0) offset = 0

  Promise.all([                             //Le Promise.all permet d'attendre la résolution de toute les promesses avant de passer à la suite.
    User.getAll(limit, offset),             //Nous récupérons ici les users
    User.count()                            //Nous récupérons ici le nombre de users
  ]).then((results) => {
    res.format({
      html: () => {
        res.render('users/index', {         //Nous appelons ici la vue index de users en lui passant les users récupérer ainsi que le nombre de ces derniers
          users: results[0],
          count: results[1].count,
          limit: limit,
          offset: offset
        })
      },
      json: () => {                         //Nous passons les Users et leur nombres en Json également
        res.send({
          data: results[0],
          meta: {
            count: results[1].count
          }
        })
      }
    })
  }).catch(next)
})

router.get('/:userId(\\d+)/edit', (req, res, next) => {   //Cette route va servir à appeler la vue edit de users, qui permet de remplir un formulaire pour modifier un user
  res.format({
    html: () => {
      User.get(req.params.userId).then((user) => {      //Récupère un utilisateur grâce à son ID
        if (!user) return next()

        res.render('users/edit', {                      
          user: user,                                   //Passe à la vue le User et l'action du formulaire
          action: `/users/${user.rowid}?_method=put`
        })
      }).catch(next)
    },
    json: () => {
      let err = new Error('Bad Request')
      err.status = 400
      next(err)
    }
  })
})

router.get('/add', (req, res, next) => {                //Cette reoute va amener à la vue pour créer un utilisateur
  res.format({
    html: () => {
      res.render('users/edit', {
        user: {},                                        
        action: '/users/add'
      })
    },
    json: () => {
      let err = new Error('Bad Request')
      err.status = 400
      next(err)
    }
  })
})

router.get('/:userId(\\d+)', (req, res, next) => {            //Cette route permet d'amener à la vue pour afficher précisément un utilisateur
  User.get(req.params.userId).then((user) => {
    if (!user) return next()

    res.format({
      html: () => { res.render('users/show', { user: user }) },
      json: () => { res.send({ data: user }) }
    })
  }).catch(next)
})

router.post('/add', (req, res, next) => {                 //Cette route permet d'insérer un utilisateur dans la BDD
  if (
    !req.body.pseudo || req.body.pseudo === '' ||
    !req.body.password || req.body.password === '' ||     //On test ici si aucun des champs n'est vide
    !req.body.email || req.body.email === '' ||
    !req.body.firstname || req.body.firstname === ''
  ) {
    let err = new Error('Bad Request')
    err.status = 400
    return next(err)
  }

  User.insert(req.body).then(() => {                      //Si les champs sont remplis, on insert un nouvel user
    res.format({
      html: () => {
        res.redirect('/users')                            //On le redirige ensuite vers la liste des users
      },
      json: () => {
        res.status(201).send({message: 'success'})        //On envoit un status de succès en Json
      }
    })
  }).catch(next)
})

router.delete('/:userId(\\d+)', (req, res, next) => {       //Cette route permet de lancer la suppression d'un user par son id
  User.remove(req.params.userId).then(() => {
    res.format({
      html: () => { res.redirect('/users') },               //On le redirige ensuite vers la liste des users
      json: () => { res.send({ message: 'success' }) }      //On envoit un status de succès en Json
    })
  }).catch(next)
})


router.put('/:userId(\\d+)', (req, res, next) => {          //Cette route permet de lancer l'update d'un user après être passé par le formulaire
  User.update(req.params.userId, req.body).then(() => {
    res.format({
      html: () => { res.redirect('/users') },               //On le redirige ensuite vers la liste des users
      json: () => { res.send({ message: 'success' }) }      //On envoit un status de succès en Json
    })
  }).catch(next)
})

module.exports = router