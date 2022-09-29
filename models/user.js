const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
    },

    name:{
        type: String,
        required: true
    },
    
    followers: [  
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'USER'
        }
    ],

    following: [  
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'USER'
        }
    ],
    
    messages:[
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MESSAGES'
    }
],

    posts:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'POST'
    }],


    passwordHash:{
        type: String,
        required: true
    },

    icon:{
        type: String
    },

    backImage: {
        type: String
    },
    bio: {
        type: String
    },

    verified: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('USER', schema)