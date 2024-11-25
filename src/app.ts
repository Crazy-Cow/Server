import dotenv from 'dotenv'
dotenv.config()

import cors, { CorsOptions } from 'cors'
import express, { Express } from 'express'
import cookieParser from 'cookie-parser'
import routes from './routes'
// import { connectDB } from './schemas'
import { initSocket } from './socket'
import { Server } from 'socket.io'

const port = process.env.PORT
const corsOption: CorsOptions = { origin: '*' }

const app: Express = express()
app.use(cors(corsOption))
app.use(cookieParser())
app.use(express.json())
app.use('/example', routes.example)
app.use('/user', routes.user)

const server = app.listen(port, () => {
    console.log(`[2] Server runs at <http://localhost>:${port}`)
})

const io = new Server(server, { cors: corsOption })

initSocket(io)

// connectDB()
//     .then(() => console.log('[1] DB Connected'))
//     .then(() => {
//         console.log('[1] (mongoDB) DB Connected')
//         const server = app.listen(port, () => {
//             console.log(`[2] Server runs at <http://localhost>:${port}`)
//         })

//         const io = new Server(server, socketCorsOption)
//         initSocket(io)
//         initInGmaeSocket(io)
//     })
//     .catch((err) => {
//         console.error('[Error] DB Connection Failed:', err)
//     })
