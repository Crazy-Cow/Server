import { Schema, model } from 'mongoose'

const userScheme = new Schema({
    nickName: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: false,
    },
    challengermodeId: {
        type: String,
        required: false,
    },
    pictureUrl: {
        type: String,
        required: false,
    },
    isTournament: {
        type: Boolean,
        default: false,
    },
    createdAt: { type: Date, default: Date.now },
})

export default model('users', userScheme)
