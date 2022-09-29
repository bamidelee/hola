const {gql} = require('apollo-server')

const typeDefs = gql`
    type User {
        username: String
        name: String
        passwordHash: String!
        followers: [User]
        following: [User]
        _id : ID
        messages: [Messages]
        posts: [Post]
        icon: String
        backImage: String
        bio: String
        verified: Boolean
    }

    type Messages {
        text: String
        sender: User
        receiver:User
        _id: ID!
        mediaType: String
        date: Date!
        media: String
    }

    type Post {
        text : String
        from: User
        date: Date!
        _id: ID!
        media: String
        mediaType: String
        comments: [Post]
        commentTo: Post
        likes: [String]
    }

   

    type Token {
        value: String!
    }

    type Query {
        findUser(username: String): User
        searchUsers(username:String): [User]
        dashPost(username: String): [Post]
        findPost(id: ID): Post
    }

    type Mutation {
        signUp(
            name: String!
            username: String!
            password: String!
        ): User

        signIn(
            username: String!
            password: String!
        ): Token

        createPost(
           media: String
           mediaType: String
            text: String
            followers: [String]
            commentTo: ID
        ): Post

        like(
            id: ID! 
            ): Post

    

        follow(
            follower: ID
            following: ID!
        ): User

        text(
            sender: ID!
            receiver:ID!
            text:String
            media: String
            mediaType: String
        ): Messages

        profile(
            icon: String
            bio: String
            backImage: String
            name: String
        ): User

    }

    scalar Date
    
type MyType {
    created: Date
}

    type Subscription{
        newPost(follow:String): Post
        newMessage(sender:String): Messages

    }


`

module.exports = typeDefs