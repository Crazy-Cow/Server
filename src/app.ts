import dotenv from 'dotenv'
dotenv.config()

import cors from 'cors'
import express, { Express } from 'express'
import cookieParser from 'cookie-parser'
import routes from './routes'
// import { connectDB } from './schemas'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from './docs/swagger-output.json'
import { initSocket } from './socket'
import { Server } from 'socket.io'
import { initInGmaeSocket } from './game/server'

const port = process.env.PORT

const app: Express = express()
app.use(cors({ origin: '*' }))
app.use(cookieParser())
app.use(express.json())
app.use('/example', routes.example)
app.use('/user', routes.user)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

const server = app.listen(port, () => {
    console.log(`[2] Server runs at <http://localhost>:${port}`)
})

const allowedOrigins = ['http://localhost:5173']

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'), false)
            }
        },
        methods: ['GET', 'POST'],
    },
})

initSocket(io)
initInGmaeSocket(io)

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
