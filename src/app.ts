import dotenv from 'dotenv'
dotenv.config()

import cors from 'cors'
import express, { Express } from 'express'
import cookieParser from 'cookie-parser'
import routes from './routes'
import { AppDataSource } from './db'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from './docs/swagger-output.json'
import http from 'http'
import socketIo from 'socket.io'
import { handleSocketConnection } from './middleware/socketHandler'
// import { Socket } from 'dgram'

const app: Express = express()
const server = http.createServer(app)
const io = new socketIo.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})
const port = process.env.PORT

app.use(express.static(__dirname + '/client'))
app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use('/', routes)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`)
    socket.on('testEvent', () => {
        console.log(`Test event received from ${socket.id}`)
        socket.emit('testResponse', 'Connection successful')
    })

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`)
    })
    handleSocketConnection(socket, io)
})

AppDataSource.initialize()
    .then(() => {
        console.log('[1] (mysql) DB Connected')
        server.listen(port, () => {
            console.log(`[2] Server runs at <https://localhost>:${port}`)
        })
    })
    .catch((err) => {
        console.error('[Error] (mysql) DB Connection Failed:', err)
    })
