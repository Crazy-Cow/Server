import dotenv from 'dotenv'
dotenv.config()

import cors from 'cors'
import express, { Express, Request, Response } from 'express'
import routes from './routes'
import { AppDataSource } from './db'

const app: Express = express()
const port = 8000

app.use(cors())
app.use(express.json())
app.use('/posts', routes.post)
app.use('/users', routes.user)

app.get('/', async (req: Request, res: Response) => {
    res.send('Typescript + Node.js + Express Server + MongoDB')
})

app.listen(port, async () => {
    await AppDataSource.initialize()
        .then(() => {
            console.log('[1] (mysql) DB Connected')
        })
        .catch((err) => {
            console.error('[Error] (mysql) DB Connected', err)
        })

    console.log(`[2] Server runs at <https://localhost>:${port}`)
})
