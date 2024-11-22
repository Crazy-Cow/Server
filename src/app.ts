import dotenv from 'dotenv'
dotenv.config()

import cors, { CorsOptions } from 'cors'
import express, { Express } from 'express'
import cookieParser from 'cookie-parser'
import routes from './routes'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from './docs/swagger-output.json'
import { initSocket } from './socket'
import { Server } from 'socket.io'
import { connectRedisDB } from './db/redis'

const port = process.env.PORT
const corsOption: CorsOptions = { origin: '*' }

const app: Express = express()
app.use(cors(corsOption))
app.use(cookieParser())
app.use(express.json())
app.use('/example', routes.example)
app.use('/user', routes.user)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

connectRedisDB()
    .then(() => console.log('[1] Redis DB Connected'))
    .then(() => {
        const server = app.listen(port, () => {
            console.log(`[2] Server runs at <http://localhost>:${port}`)
        })

        const io = new Server(server, { cors: corsOption })
        initSocket(io)
    })
    .catch((err) => {
        console.error('[Error] Fail to start server', err)
    })
