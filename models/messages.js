const stringify = require('fast-json-stable-stringify')
const mongoose = require('mongoose')

const schema = mongoose.Schema({
    text:{
        type: String,
    },

   media:{
        type: String,
        required: true,
    },

    date: {
        type: Date,
        required: true
    },

    sender :{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
        required: true
    },

    receiver : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER',
        required: true
    },

    mediaType: {
        type: String,
   
    }

})

module.exports = mongoose.model('MESSAGES', schema)