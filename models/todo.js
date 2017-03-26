const mongoose = require('mongoose')    //Appel de Mongoose

// Déclaration du schéma de team
var todoSchema = new mongoose.Schema({      //Création du Schema d'un TODO
  todoId: String,
  userId: String,
  topic: String,
  completed: {type : Boolean, default : false },    //On instance le champ completed à false par défaut.
  createdAt: Date,
  updatedAt: {type : Date, default : Date.now },    //On instance l'updated à la date actuelle
  completedAt: Date
})


var Todo = mongoose.model('todos', todoSchema);     //Création d'un model à partir du Schema

module.exports = {
  add: (userId, topic) => {                         //Fonction d'ajout d'un todo
    var todo = new Todo({
      todoId: require('uuid').v4(),
      userId: userId,
      topic: topic
    })
    return todo.save()
  },

  list: (userId) => {                               //Fonction renvoyant tous les todos pour un utilsateur.
    return Todo.find({userId: userId}).exec()
  },

  listCompleted: (userId) => {                            //Fonction renvoyant tous les todos complétés pour un utilisateur
    return Todo.find({userId: userId, completed: true})
  },

  listNotCompleted: (userId) => {                         //Fonction renvoyant tous les todos non complétés.
    return Todo.find({userId: userId, completed: false})
  },

  changeState: (todoId) => {        //Change l'état d'un todo à Complété s'il ne l'est pas, et à non complété s'il l'était.
    return Todo.update(
      {todoId: todoId},
      {$set: {
        completed: true,
        completedAt: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        updatedAt: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
      }},
      {upsert: true}
    )
  },

  deleteByUserId: (userId) => {                  //Supprime les todos d'un utilsateur
    var Todos = Todo.find({userId: userId})
    return Todos.remove()
  }
} 