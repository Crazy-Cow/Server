import dotenv from 'dotenv'
import mongoose from 'mongoose'
dotenv.config()

const dbUserName = process.env.MONGO_DB_USERNAME
const dbPassword = process.env.MONGO_DB_PASSWORD
const dbName = process.env.MONGO_DB_DATABASE

const uri = `mongodb+srv://${dbUserName}:${dbPassword}@express-practice.q33pr.mongodb.net/${dbName}`

const connectDB = () => mongoose.connect(uri)

export { connectDB }
