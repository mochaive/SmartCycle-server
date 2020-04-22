const mongoose = require('mongoose')
const Schema = mongoose.Schema

const pictureSchema = new Schema({

    filename: String,
    path: String,
    nugu_id: String,
    published_date: { type: Date, default: Date.now }
    
})


module.exports = mongoose.model('picture', pictureSchema)