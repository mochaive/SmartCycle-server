const mongoose = require('mongoose')
const Schema = mongoose.Schema

const latelyTrashSchema = new Schema({

    user_email: String,
    trash_id: String,
    imageURL: String,
    date: String
    
})


module.exports = mongoose.model('latelyTrash', latelyTrashSchema)