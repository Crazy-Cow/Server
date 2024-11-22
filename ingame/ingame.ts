import express from 'express'
import dotenv from 'dotenv'
import { createClient } from 'redis'

dotenv.config()
const app = express()
const port = process.env.PORT || 8002

// Redis 연결 설정
const redisHost = process.env.REDIS_HOST || 'localhost'
const redisPort = Number(process.env.REDIS_PORT) || 6379

const redisClient = createClient({
    url: `redis://${redisHost}:${redisPort}`,
})

redisClient.on('error', (err) => {
    console.error('Redis Client Error', err)
})

// 서버 시작 함수
async function startServer() {
    try {
        await redisClient.connect()
        console.log('[2] (Redis) Connected')

        app.get('/ingame', async (req, res) => {
            try {
                // Redis에 키 저장 및 가져오기 예제
                await redisClient.set('message', 'Hello from Ingame Server!')
                const message = await redisClient.get('message')
                res.send(message)
            } catch (err) {
                console.error('Redis error:', err)
                res.status(500).send('Redis error')
            }
        })

        app.listen(port, () => {
            console.log(`Ingame server is running on port ${port}`)
        })
    } catch (err) {
        console.error('[Error] Redis Connection Failed:', err)
        process.exit(1)
    }
}

startServer()
