const mongoose = require('mongoose')
const Schema = mongoose.Schema

const quizSchema = new Schema({

    id: String,
    quiz: String,
    answer: String,
    incorrect_script: String,
    published_date: { type: Date, default: Date.now }

})


module.exports = mongoose.model('quiz', quizSchema)