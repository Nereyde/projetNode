//Dépendances
const router = require('express').Router()
const Session = require('../models/session')
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

router.get('/', (req, res, next) => {                   // Quand on arrive sur /sessions, nous appelons la vue index.pug dans sessions.
  res.format({
    html: () => {res.render('sessions/index', {})},
    json: () => {
      let err = new Error('Bad Request')
      err.status = 400
      next(err)
    }
  })
})

router.post('/', (req, res, next) => {                //Cette route est prise lors de l'envoi du formulaire pour se connecter.

  if (
    !req.body.pseudo || req.body.pseudo === '' ||         //On test ici si les champs sont remplis ou non.
    !req.body.password || req.body.password === ''
  ) {
    res.format({
      html: () => {
        res.render('sessions/index', {                  //Si ce n'est pas le cas on le redirige vers la vue index dans session, mais cette fois avec un message indiquant de remplir les champs.
          message: 'Merci de remplir les champs.'
        })
      },
      json: () => {
        let err = new Error('Bad Request')              //On envoit une error 400 en Json
        err.status = 400
        next(err)
      }
    })
  }else{
    User.getByPseudo(req.body.pseudo).then((user) => {          //On essaye de récupérer le User grâce au pseudo passé dans le formulaire de connexion
      if(!user || user == ""){
        res.format({
          html: () => {
            res.render('sessions/index', {                      //Si nous n'arrivons pas à réccupérer le User, c'est que le compte n'existe pas
            message: 'Ce compte n\'existe pas !'                //On rappelle donc la vue index avec un message correspondant
            })
          },

          json: () => {
            let err = new Error('Bad Request')           //On envoit une error 400 en Json
            err.status = 400
            next(err)
          }
        })
      }else{                                                              //Si jamais le compte existe, nous allons comparer les mots de passe pour connecter l'utilisateur

        var match = bcrypt.compareSync(req.body.password, user.password)   //Fonction de bcrypt permettant de comparer le hash du mot de passe passé dans le formulaire avec le hash stocké en BDD

        if(match) {
          console.log('Match !')

          crypto.randomBytes(256, (err, buf) => {                 //Si la connexion réussi, on crée un Token que l'on stockera dans un cookie.
            var token = buf.toString('hex')
            Session.add(user.rowid, token).then(() => {
              res.format({
                html: () => {
                  res.cookie('accessToken', token, {httpOnly: true })     //Je ne savais pas ici si je devais utiliser le paramètre expires: Date, étant donné que l'on met une expireDate pour la session. Le remettre ici avait l'air de produire quelques bugs, notamment une session qui expirais bien avant le cookie.
                  res.redirect('/')                                       
                },
                json: () => {                                 //En Json, on envoit le token
                  res.send({accessToken: token})
                }
              })
            }).catch((err) => {
              console.error('> Err: ', err)       //On affiche toute erreur qui a pu survenir
            })
        })

        }else{
          res.format({
            html: () => {
              res.render('sessions/index', {
              message: 'Mot de passe incorect !'      //On gère ici le cas où l'utilsateur n'a pas tapé le bon mot de passe. On rappelle donc la vue avec un aure message.
              })
            },

            json: () => {
              let err = new Error('Bad Request')
              err.status = 400                          //On envoit encore une error 400 en Json
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

router.delete('/', (req, res, next) => {                //Fonction de suppression du cookie, qui permettra la déconnexion
  res.format({
    html: () => {
      res.clearCookie('accessToken')
      res.redirect('/sessions')
    },
    json: () => {
      res.status(200).send({message: 'success'})        //On envoit un status 200 en Json, signifiant la réussite de la fonction
    }
  })
})

/*router.get('/timeLeft', (req, res, next) => {
                                                        //Je voulais faire ici une fonction montrant à l'utilsateur le temps avant que sa session n'expire. Je n'ai pas eu le temps de l'implémenter.
})*/

module.exports = router