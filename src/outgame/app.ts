import dotenv from 'dotenv'
dotenv.config()

import cors, { CorsOptions } from 'cors'
import express, { Express } from 'express'
import cookieParser from 'cookie-parser'
import routes from './routes'
import { Server } from 'socket.io'
import { initOutGameSocket } from './socket'
import redisManager from '../db/redis/redis-manager'

const port = process.env.PORT
const corsOption: CorsOptions = { origin: '*' }

const app: Express = express()
app.use(cors(corsOption))
app.use(cookieParser())
app.use(express.json())
app.use('/example', routes.example)
app.use('/user', routes.user)

redisManager.common
    .connect()
    .then(() => console.log('[1] (common) Redis Connected'))
    .then(() => {
        const server = app.listen(port, () => {
            console.log(`[2] Server runs at <http://localhost>:${port}`)
        })

        const io = new Server(server, { cors: corsOption })
        initOutGameSocket(io)
    })
    .catch((err) => {
        console.error('[Error] Fail to start server', err)
    })
