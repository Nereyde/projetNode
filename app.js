// Dépendances native
const path = require('path')

// Dépendances 3rd party
const express = require('express')
const bodyParser = require('body-parser')
const sass = require('node-sass-middleware')
const db = require('sqlite')
const methodOverride = require('method-override')
const cookieParser = require('cookie-parser')

const Session = require('./models/session')

const Redis = require('ioredis')
const redis = new Redis()

const mongoose = require('mongoose')


// Constantes et initialisations
const PORT = process.PORT || 8080
const app = express()

//Ouverture de la BDD MongoDB avec mongoose
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost/todos', function(err) {
  if (err) { throw err }
})

// Mise en place des vues
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Préprocesseur sur les fichiers scss -> css
app.use(sass({
  src: path.join(__dirname, 'styles'),
  dest: path.join(__dirname, 'assets', 'css'),
  prefix: '/css',
  outputStyle: 'expanded'
}))

// On sert les fichiers statiques
app.use(express.static(path.join(__dirname, 'assets')))

// Method override
app.use(methodOverride('_method', {methods: ['GET', 'POST']}))

// Middleware pour parser le body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(cookieParser())

//Middleware pour la connexion. Cela empêchera tout utilisateur non identifié à atteindre les autres pages. Il pourra malgré tout pouvoir créer un utilsateur pour avoir un compte auquel se connecter.
app.use((req, res, next) => {
  if ((req.url == '/sessions') && (req.method == 'GET' || req.method == 'POST' || req.method == 'DELETE')) {
    next()
  }else{
    if (req.cookies.accessToken || req.headers['x-accesstoken']) {
      var accessToken = req.cookies.accessToken
      if (!accessToken) accessToken = req.headers['x-accesstoken']

      //redis.hgetall('token:'+accessToken).then((result) => {
      Session.exists(accessToken).then((result) => {
        if (result && result != "") {
          if (result['expiresAt'] > Date.now()) {
            next()
          }else{
            res.format({
              html: () => {
                res.redirect('/sessions')
              },
              json: () => {
                let err = new Error('Unauthorized')
                err.status = 401
                next(err)
              }
            })
          }
        }else{
          res.format({
            html: () => {
              res.redirect('/sessions')
            },
            json: () => {
              let err = new Error('Unauthorized')
              err.status = 401
              next(err)
            }
          })
        }
      })
    }else{
      res.format({
        html: () => {
          res.redirect('/sessions')
        },
        json: () => {
          let err = new Error('Unauthorized')
          err.status = 401
          next(err)
        }
      })
    }
  }
})

// La liste des différents routeurs (dans l'ordre)
app.use('/sessions', require('./routes/sessions'))
app.use('/todos', require('./routes/todos'))
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/users'))

// Erreur 404
app.use(function(req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

// Gestion des erreurs
// Notez les 4 arguments !!
app.use(function(err, req, res, next) {
  // Les données de l'erreur
  let data = {
    message: err.message,
    status: err.status || 500
  }

  // En mode développement, on peut afficher les détails de l'erreur
  if (app.get('env') === 'development') {
    data.error = err.stack
  }

  // On set le status de la réponse
  res.status(data.status)

  // Réponse multi-format
  res.format({
    html: () => { res.render('error', data) },
    json: () => { res.send(data) }
  })
})

db.open('bdd.db').then(() => {
  console.log('> BDD opened')
  return Promise.all([
    db.run('CREATE TABLE IF NOT EXISTS users (pseudo, email, password, firstname, createdAt)'),
    db.run('CREATE TABLE IF NOT EXISTS sessions (userId, accessToken, createdAt, expiresAt)')
  ])
}).then(() => {
  console.log('> Tables persisted')

  app.listen(PORT, () => {
    console.log('> Serveur démarré sur le port : ', PORT)
  })
}).catch((err) => {
  console.error('> Err: ', err)
})