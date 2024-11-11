import mongoose from 'mongoose'

const postScheme = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    created_at: { type: Date, default: Date.now },
})

export default mongoose.model('posts', postScheme)
