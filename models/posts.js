const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    text:{
        type: String,
       
    },

    media: {
        type: String,
    },
    mediaType: {
        type: String,
    },

    from: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'USER',
       required: true
    },

    followers: [{
        
            type:String
    }],

    likes: [{
        type: String
    }],
     date: {
        type: Date,
        required: true
     },

     comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'POST'
     }],

     commentTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'POST'
     }


})

module.exports = mongoose.model('POST', schema)