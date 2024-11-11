import dotenv from 'dotenv'
dotenv.config()

import cors from 'cors'
import express, { Express } from 'express'
import cookieParser from 'cookie-parser'
import routes from './routes'
import { connectDB } from './schemas'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from './docs/swagger-output.json'

const app: Express = express()
const port = process.env.PORT

app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use('/example', routes.example)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

connectDB()
    .then(() => {
        console.log('[1] (mysql) DB Connected')
        app.listen(port, () => {
            console.log(`[2] Server runs at <https://localhost>:${port}`)
        })
    })
    .catch((err) => {
        console.error('[Error] (mysql) DB Connection Failed:', err)
    })
