const {UserInputError, AuthenticationError} = require('apollo-server')
const User = require('./models/user')
const Post = require('./models/posts')
const Messages = require('./models/messages')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const {PubSub} = require('graphql-subscriptions')
const pubsub = new PubSub()
const { findById } = require('./models/user')
const Comment = require('./models/comments')
const { withFilter } = require( 'graphql-subscriptions')
const { GraphQLScalarType } = require( 'graphql')
const { Kind } = require('graphql/language')
require('dotenv').config()
const JWT_SECRET = process.env.SECRET
const resolvers = {

    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            return new Date(value); // value from the client
        },
        serialize(value) {
            return value.getTime(); // value sent to the client
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
            return parseInt(ast.value, 10); // ast value is always in string format
            }
            return null;
        },
    }),

    Query:{
        findUser: async(root, args) => User.findOne({username: args.username})
        .populate('followers')
        .populate('following')
        .populate({path: 'posts', populate:{path:'comments'}})
        .populate({path:'posts', populate:{path:'from'}})
        .populate({path:'posts', populate:{path:'commentTo', populate:{path:'from'}}})
        .populate({path: 'messages', populate:{path:'sender'}})
        .populate({path:'messages', populate:{path:'receiver'}})
        .exec(),

        searchUsers: async(root, args) => {
            const reg = new RegExp(args.username)
            return await User.find({username:{$regex:reg, $options: 'si'}})
            
        },

    dashPost: async(root,args) => await Post.find({ $or:[{followers: args.username}, {from: "6335b7a7753040e949746805"}]}).populate('comments')
        .populate('from')
        .populate('commentTo')
        .populate({path: 'commentTo', populate: {path: 'from'}})
        .exec(),

    findPost: async(root, args) =>await Post.findById(args.id)
    .populate('from')
    .populate({path:'comments', populate:{path: 'from'}})
    .populate({path: 'commentTo', populate: {path: 'from'}})
    .exec()

    },


    Mutation: {
        signUp: async(root,args) => {
            const existingUser = await User.findOne({username: args.username})
            if(existingUser){
                throw new UserInputError('Username taken')
            }
            const {username, password, name} = args
            const saltRounds = 10
            const passwordHash = await bcrypt.hash(password, saltRounds)
           
            const user = new User({
                username,
                passwordHash,
                name,
                icon:'',
                bio: '',
                backImage: ''
            })
            try
          {  await user.save()}
           
            catch(error)  {
                throw new UserInputError(error.messages,{
                    invalidArgs: args
                })
            }
            return user
        },

        signIn: async(root, args) => {
            const user = await User.findOne({username: args.username})
            const passwordCorrect = user === null? false
            : await bcrypt.compare(args.password, user.passwordHash) 
            if(!(user && passwordCorrect)){
                throw new UserInputError('User not found')
            }

            const userForToken = {
                username: user.username,
                id: user._id
            }
            return{value: jwt.sign(userForToken, JWT_SECRET)}
        },

        createPost: async(root, args, context) => {
            const {media, text, followers,commentTo,mediaType} = args
           
            const post = new Post({
                 media,
                 mediaType,
                text,
                followers,
                from: context.currentUser._id,
                commentTo,
                date: new Date()
            })
            const currentUser = context.currentUser
                currentUser.posts = currentUser.posts.concat(post._id)
            if(!currentUser){
                throw new AuthenticationError('you have to login')
            }

            try{
                await currentUser.save()
                await post.save()
            }
            catch (error) {throw new UserInputError(error.message, {
                invalidArgs: args
            })}

             if(commentTo){
                try{
                    const p = await Post.findById(commentTo)
                    p.comments = p.comments.concat(post._id)
                    await p.save()
                }catch(error){
                    throw new UserInputError('update failed')
                } 
              }
            const post2 = await Post.findById(post._id)
            .populate('comments')
            .populate('from')
            .populate({path:'commentTo', populate:{path: 'from'}})
            .exec()
            pubsub.publish('POST_CREATED', {newPost: post2})
            return post2
        },

        like: async(root, args, context) => {

            const post =await Post.findById(args.id)
           try  {
                if(!post.likes.includes(context.currentUser.username)){
                    post.likes = post.likes.concat(context.currentUser.username)
                }
                else{
                    post.likes = post.likes.filter((item) => item !== context.currentUser.username)
                }
          
            await post.save()
            }
            catch(error){
                throw new UserInputError(error.message)
            }

            return await Post.findById(post._id)
            .populate('comments')
            .populate('from')
            .populate({path:'commentTo', populate:{path: 'from'}})
            .exec()
        },
        
        follow: async(root, args, context) => {
            const follower = await User.findById(args.follower).populate('followers').populate('following').exec()
            const following = await User.findById(args.following).populate('followers').populate('following').exec()

            try
            {
                if(follower.following.find((user)=> user.username === following.username)){
                    follower.following = follower.following.filter((user) => user.username !== following.username)
                    following.followers = following.followers.filter((user) => user.username !== follower.username)
                }
                else{
                    follower.following = follower.following.concat(following._id)
                    following.followers = following.followers.concat(follower._id)
                }
               
                await follower.save()
               
                await following.save()
            }
            catch(error){
                throw new UserInputError(error.message)
            }
            return follower
        },

        text: async(root, args, context) => {
            
            let {mediaType, text, receiver, media} = args
            
            const message = new Messages({
                text,
                mediaType,
                date: new Date(),
                receiver,
                media,
                sender: context.currentUser._id
            })
            const currentUser = context.currentUser
           
            try
            {
                await message.save()
                currentUser.messages = currentUser.messages.concat(message._id)
                const Receiver = await User.findById(receiver)
                Receiver.messages = Receiver.messages.concat(message._id)
                await currentUser.save()
                await Receiver.save()}
                catch(error){
                throw new UserInputError(error.message,{
                    invalidArgs: args
                })
            }
            const message2 = await Messages.findById(message._id).populate('sender').populate('receiver').exec()
            pubsub.publish('NEW_MESSAGE', {newMessage: message2})
            return message2

        },

        profile: async(root, args, context) => {
            const currentUser = context.currentUser
            try { 
              
              currentUser.icon = args.icon
              currentUser.bio = args.bio
              currentUser.name = args.name
              currentUser.backImage = args.backImage

              await currentUser.save()}
              catch(error){
              
              }
             
              return currentUser

        },

        
    },

    Subscription: {
        newPost:{
            subscribe: withFilter(
                () => pubsub.asyncIterator(['POST_CREATED']),
                (payload, variables) => {
               
                    return (payload.newPost.followers.includes(variables.follow) );
                  },
            )
        },

        newMessage:{
            subscribe: withFilter(
                () => pubsub.asyncIterator(['NEW_MESSAGE']),
                (payload, variables) => {
                    return (payload.newMessage.receiver.username === variables.sender  );
                  },
            )
        },

     
    }
}

module.exports = resolvers