import { Schema, model } from 'mongoose'

const userScheme = new Schema({
    nickName: {
        type: String,
        required: true,
    },
    hashedPassword: {
        type: String,
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
})

export default model('users', userScheme)
