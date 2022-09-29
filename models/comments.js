const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    text: {
        type: String,
    },

    mediaType: {
        type: String,
    },

    media: {
        type: String,
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'USER'
    },

    date: {
        type: Date
    }
})

module.exports = mongoose.model('COMMENT', schema)