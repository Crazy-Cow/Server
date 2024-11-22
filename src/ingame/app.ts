import dotenv from 'dotenv'
dotenv.config()

import cors, { CorsOptions } from 'cors'
import express, { Express } from 'express'
import { Server } from 'socket.io'
import { connectRedisDB } from '../db/redis'
import { initInGameSocket } from './socket'

const port = 9000 // TODO: 다른 port
const corsOption: CorsOptions = { origin: '*' }

const app: Express = express()
app.use(cors(corsOption))

connectRedisDB()
    .then(() => console.log('[1] Redis DB Connected'))
    .then(() => {
        const server = app.listen(port, () => {
            console.log(`[2] Server runs at <http://localhost>:${port}`)
        })

        const io = new Server(server, { cors: corsOption })
        initInGameSocket(io)
    })
    .catch((err) => {
        console.error('[Error] Fail to start server', err)
    })
