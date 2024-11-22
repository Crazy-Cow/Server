import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { createClient } from 'redis'

dotenv.config()
const dbUserName = process.env.MONGO_DB_USERNAME
const dbPassword = process.env.MONGO_DB_PASSWORD
const dbName = process.env.MONGO_DB_DATABASE

const uri = `mongodb+srv://${dbUserName}:${dbPassword}@express-practice.q33pr.mongodb.net/${dbName}`

const app = express()
const port = process.env.PORT || 8001

// Redis 연결 설정
const redisHost = process.env.REDIS_HOST || 'localhost'
const redisPort = Number(process.env.REDIS_PORT) || 6379

const redisClient = createClient({
    url: `redis://${redisHost}:${redisPort}`,
})

redisClient.on('error', (err) => {
    console.error('Redis Client Error', err)
})

// 데이터베이스 연결 함수
async function connectDatabases() {
    try {
        // MongoDB 연결
        await mongoose.connect(uri)
        console.log('[1] (MongoDB) DB Connected')

        // Redis 연결
        await redisClient.connect()
        console.log('[2] (Redis) Connected')
    } catch (err) {
        console.error('[Error] Database Connection Failed:', err)
        process.exit(1)
    }
}

// 서버 시작 함수
async function startServer() {
    await connectDatabases()

    app.get('/outgame', async (req, res) => {
        try {
            // Redis에 키 저장 및 가져오기 예제
            await redisClient.set('message', 'Hello from Outgame Server!')
            const message = await redisClient.get('message')
            res.send(message)
        } catch (err) {
            console.error('Redis error:', err)
            res.status(500).send('Redis error')
        }
    })

    app.listen(port, () => {
        console.log(`Outgame server is running on port ${port}`)
    })
}

startServer()
