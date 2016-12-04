const router = require('express').Router()
const Session = require('../models/session')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

router.get('/', (req, res, next) => {
  res.format({
    html: () => {
      res.render('sessions/index', {
        /*user: {},
        action: '/users'*/
      })
    },
    json: () => {
      let err = new Error('Bad Request')
      err.status = 400
      next(err)
    }
  })
})

router.post('/', (req, res, next) => {

  if (
    !req.body.pseudo || req.body.pseudo === '' ||
    !req.body.password || req.body.password === ''
  ) {
    res.format({
      html: () => {
        res.render('sessions/index', {
          message: 'Merci de remplir les champs.'
        })
      },
      json: () => {
        let err = new Error('Bad Request')
        err.status = 400
        next(err)
      }
    })
  }else{
    User.getByPseudo(req.body.pseudo).then((user) => {
      if(!user || user == ""){
        res.format({
          html: () => {
            res.render('sessions/index', {
            message: 'Ce compte n\'existe pas !'
            })
          },

          json: () => {
            let err = new Error('Bad Request')
            err.status = 400
            next(err)
          }
        })
      }else{

        var match = bcrypt.compareSync(req.body.password, user.password)

        console.log('rowid = ', user.rowid)

        if(match) {
          console.log('Match !')

          crypto.randomBytes(256, (err, buf) => {
            var token = buf.toString('hex')
            Session.add(user.rowid, token).then(() => {
              res.format({
                html: () => {
                  res.cookie('accessToken', token, {httpOnly: true })
                  res.redirect('/')
                },
                json: () => {
                  res.send({accessToken: token})
                }
              })
            }).catch((err) => {
        console.error('> Err: ', err)
            })
        })

        }else{
          res.format({
            html: () => {
              res.render('sessions/index', {
              message: 'Mot de passe incorect !'
              })
            },

            json: () => {
              let err = new Error('Bad Request')
              err.status = 400
              next(err)
            }
          })     
        }
      }
    }).catch((err) => {
        console.error('> Err: ', err)
      })
  }

})

router.delete('/', (req, res, next) => {
  res.format({
    html: () => {
      res.clearCookie('accessToken')
      res.redirect('/sessions')
    },
    json: () => {
      res.status(200).send({message: 'success'})
    }
  })
})

module.exports = router