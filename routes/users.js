const router = require('express').Router()
const User = require('../models/user')

/* Users : liste */
router.get('/', (req, res, next) => {
  let limit = parseInt(req.query.limit) || 20
  let offset = parseInt(req.query.offset) || 0

  if (limit < 1) limit = 1
  else if (limit > 100) limit = 100

  if (offset < 0) offset = 0

  Promise.all([
    User.getAll(limit, offset),
    User.count()
  ]).then((results) => {
    // results[0] => [user, user, user]
    // results[1] => {count: ?}
    res.format({
      html: () => {
        res.render('users/index', {
          users: results[0],
          count: results[1].count,
          limit: limit,
          offset: offset
        })
      },
      json: () => {
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

router.get('/:userId(\\d+)/edit', (req, res, next) => {
  res.format({
    html: () => {
      User.get(req.params.userId).then((user) => {
        if (!user) return next()

        res.render('users/edit', {
          user: user,
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

router.get('/add', (req, res, next) => {
  res.format({
    html: () => {
      res.render('users/edit', {
        user: {},
        action: '/users'
      })
    },
    json: () => {
      let err = new Error('Bad Request')
      err.status = 400
      next(err)
    }
  })
})

router.get('/:userId(\\d+)', (req, res, next) => {
  User.get(req.params.userId).then((user) => {
    if (!user) return next()

    res.format({
      html: () => { res.render('users/show', { user: user }) },
      json: () => { res.send({ data: user }) }
    })
  }).catch(next)
})

router.post('/', (req, res, next) => {
  if (
    !req.body.pseudo || req.body.pseudo === '' ||
    !req.body.password || req.body.password === '' ||
    !req.body.email || req.body.email === '' ||
    !req.body.firstname || req.body.firstname === ''
  ) {
    let err = new Error('Bad Request')
    err.status = 400
    return next(err)
  }

  User.insert(req.body).then(() => {
    res.format({
      html: () => {
        res.redirect('/users')
      },
      json: () => {
        res.status(201).send({message: 'success'})
      }
    })
  }).catch(next)
})

router.delete('/:userId(\\d+)', (req, res, next) => {
  User.remove(req.params.userId).then(() => {
    res.format({
      html: () => { res.redirect('/users') },
      json: () => { res.send({ message: 'success' }) }
    })
  }).catch(next)
})


router.put('/:userId(\\d+)', (req, res, next) => {
  User.update(req.params.userId, req.body).then(() => {
    res.format({
      html: () => { res.redirect('/users') },
      json: () => { res.send({ message: 'success' }) }
    })
  }).catch(next)
})

module.exports = router