const router = require('express').Router()

/* Page d'accueil */
router.get('/', function(req, res, next) {				//La page d'accueil redirige vers les todos
  res.redirect('/todos')
})

module.exports = router
