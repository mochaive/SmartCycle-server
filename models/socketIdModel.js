const mongoose = require('mongoose')
const Schema = mongoose.Schema

const socketIdModel = new Schema({

    nugu_id: String,
    berry_id: String,
    published_date: { type: Date, default: Date.now }
    
})


module.exports = mongoose.model('socektId', socketIdModel)