const mongoose = require('mongoose')
const Schema = mongoose.Schema

const wrongTrashSchema = new Schema({

    success: String,
    user_email: String,
    fileName: String,
    trash: String,
    date: String
    
})


module.exports = mongoose.model('wrongTrash', wrongTrashSchema)