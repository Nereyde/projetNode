//Dépendances
const router = require('express').Router()

const Todo = require('../models/todo')
const User = require('../models/user')
const Session = require('../models/session')

router.get('/', (req, res, next) => {                   //La route de base va afficher tous les todos de l'utilisateur connecté
  let limit = parseInt(req.query.limit) || 20
  let offset = parseInt(req.query.offset) || 0

  if (limit < 1) limit = 1
  else if (limit > 100) limit = 100

  if (offset < 0) offset = 0

  Session.getUserId(Session.getToken(req)).then((userId) => {       //On récupère l'ID du User connecté

    if(userId){

      Todo.listCompleted(userId).then((listCompleted) => {          //On récupère la liste des todos complétés avant de la mettre dans une variable et passé à la suite.
        Todo.listNotCompleted(userId).then((listNotCompleted) =>{   //On récupère cette fois la liste des todos non complétés avant de la stocker puis de passer à la suite.
          res.format({
            html: () => {
              res.render('todos/index', {                         //On appelle la vue index.pug de todos, tout en lui passant les deux listes de todos (qui sont des objets)
                listCompleted: listCompleted,
                listNotCompleted: listNotCompleted,
                limit: limit,                                     //On lui passe également une limit et un offset pour gérer des pages s'il y a trops de todos à afficher.
                offset: offset
              })
            },
            json: () => {                                         //On envoit la liste des todos en Json
              res.send({                      
                data: list
              })
            }
          })
        })
      })
    }else{
      res.format({
        html: () => {
          res.redirect('/')                       //On redirige vers l'accueil si nous n'avons pas pu récupérer l'ID du User connecté. Cela voudrait dire qu'il n'est pas connecté.
        },
        json: () => {
          let err = new Error('Bad Request')
          err.status = 400
          next(err)
        }
      })
    }
  })
})

router.get('/add', (req, res, next) => {          //La route /todos/add permet d'appeller la vue permettant de remplir un formulaire pour créer un Todo pour l'utilisateur connecté.
    res.format({
    html: () => {
      res.render('todos/add', {
        message: "Vous pouvez ajouter une tâche ici : "
      })
    },
    json: () => {
      let err = new Error('Bad Request')
      err.status = 400
      next(err)      
    }
  })
})

router.post('/add', (req, res, next) => {                         //Cette route est prise après l'envois du formulaire de création de Todo

  Session.getUserId(Session.getToken(req)).then((userId) => {     //On récupère lID de l'utilisateur connecté.

    if(userId){
      if(!req.body.topic || req.body.topic === ""){         //On test si le champ est rempli
        res.format({
            html: () => {
              res.render('todos/add', {                                   //Et on le renvois sur la page de création de todo si ce n'est pas le cas.
                message: "Merci de remplir le seul champ de la page ! "
              })
            },
            json: () => {
              let err = new Error('Bad Request')              //On envoit encore une erreur 400 en Json
              err.status = 400
              next(err)
            }
          })
      }else{
        Todo.add(userId, req.body.topic).then((object) => {         //Si le champ est rempli, on ajoute un Todo pour l'utilisateur connecté.
          res.format({
            html: () => {
              res.redirect('/todos')        //Après la création du todo, on redirige l'utilisateur vers la liste de ses todos.
            },
            json: () => {
              res.status(201).send({message: 'success'})    //On envois un status 200 en Json, étant donné la réussite de la création.
            }
          })
        }).catch(next)
      }
    }else{
      res.format({
        html: () => {
          res.redirect('/')      //On redirige l'utilisateur vers l'accueil si nous n'avons pas trouvé d'utilisateur connecté. (Cela ne devrait d'ailleurs pas arriver étant donné l'incapacité d'un utilisateur non connecté à aller sur une autre page que celle de la connexion)
        },
        json: () => {
          let err = new Error('Bad Request')    //Et on envoit en Json une error 400
          err.status = 400
          next(err)
        }
      })
    }
  })
})


/*

Cette route est appelé quand un utilisateur check un todo et souhaite changer son statut
(Passer de Completed à Not completed)
J'ai eu un gros problème du à la fonction changeState qui, apparement, ne renvoyait rien.
J'ai longtemps essayé de l'implémenter coorectement et de la faire marcher, mais sans succès.
J'ai donc décidé d'essayer de l'implémenter seulement pour qu'elle passe de 'not completed' à 'completed'.
Et là ça à marché. Donc je le laisse comme ça, et je ne suis malheuresement pas en capacité de passer une tâche à 'not completed'*/


router.post('/completed', (req, res, next) => {
  Session.getUserId(Session.getToken(req)).then((userId) => {     //Récupère l'ID du User connecté
      if(userId){
      if(typeof req.body.completed == "object"){                  //Ici, on test le type de que l'on a récupéré du formulaire. Si l'utilisateur à coché au moins deux cases, le résultat sera un objet.
        //for each                                                //Si il y a plusieurs cases coché, il faut récupérer tous les IDs des todos dans l'objet pour changer leur état. ==> Je n'ai pas réussi à l'implémenter
      }else if(typeof req.body.completed == "string"){            //Si c'est un string, cela veut dire qu'une seule case a été coché
          Todo.changeState(req.body.completed).then(() => {       //Nous procédons donc au changement d'état du todo en passant son ID
              res.format({
            html: () => {
              res.redirect('/todos')                              //On redirige ensuite l'utilisateur vers la liste de ses todos
            },
            json: () => {
              res.status(201).send({message: 'success'})          //On envoit un status 201 en Json pour montrer la réussite de la requête
            }
          })
        }).catch(next)
      }else{                                                      //Si ce n'est ni un string, ni un Object, cela signifie que c'est vide.
          res.format({
            html: () => {
              res.redirect('/todos')                              //Nous redirigeons donc l'utilisateurs vers la liste des todos.
            },
            json: () => {       
              let err = new Error('Bad Request')    //Et on envoit en Json une error 400
              err.status = 400
              next(err)
            }
          })
      }
    }else{
      res.format({
        html: () => {
          res.redirect('/')                        //On redirige l'utilisateur vers l'accueil si nous n'avons pas trouvé d'utilisateur connecté. (Cela ne devrait d'ailleurs pas arriver étant donné l'incapacité d'un utilisateur non connecté à aller sur une autre page que celle de la connexion)
        },
        json: () => {
          let err = new Error('Bad Request')       //Et on envois une error 400 en Json
          err.status = 400
          next(err)
        }
      })
    }
  })
})

module.exports = router