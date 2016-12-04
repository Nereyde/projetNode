const mongoose = require('mongoose')

// Déclaration du schéma de team
var todoSchema = new mongoose.Schema({
  todoId: String,
  userId: String,
  topic: String,
  completed: {type : Boolean, default : false },
  createdAt: Date,
  updatedAt: {type : Date, default : Date.now },
  completedAt: Date
})


var Todo = mongoose.model('todos', todoSchema);

module.exports = {
  add: (userId, topic) => {
    var todo = new Todo({
      todoId: require('uuid').v4(),
      userId: userId,
      topic: topic
    })
    return todo.save()
  },

  list: (userId) => {
    var todo = Todo.find(null)
    todo.where('userId', userId)
    return todo.exec() 
  },

  completed: (todoId) => {
    return Todo.update({todoId: todoId}, {$set: {completed: true, completedAt: dateFormated()}},{upsert:true})
  },

  deleteByUserId: () => {
    var TodosToDelete = Todo.find(null)
    return TodosToDelete.remove()
  }
} 