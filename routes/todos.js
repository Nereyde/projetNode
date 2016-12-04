const router = require('express').Router()

const Todo = require('../models/todo')
const User = require('../models/user')
const Session = require('../models/session')

router.get('/', (req, res, next) => {
  let limit = parseInt(req.query.limit) || 20
  let offset = parseInt(req.query.offset) || 0

  if (limit < 1) limit = 1
  else if (limit > 100) limit = 100

  if (offset < 0) offset = 0

  Session.getUserId(Session.getToken(req)).then((userId) => {

    if(userId){
      Todo.list(userId).then((list) => {
        res.format({
          html: () => {
            res.render('todos/index', {
              list: list,
              limit: limit,
              offset: offset
            })
          },
          json: () => {
            res.send({
              data: list
            })
          }
        })
      })
    }else{
      res.format({
        html: () => {
          res.redirect('/')
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

module.exports = router