import { createClient, RedisClientType } from 'redis'

class Redis {
    redisClient: RedisClientType
    constructor() {
        this.redisClient = createClient({
            password: process.env.REDIS_PASSWORD,
            socket: {
                host: process.env.REDIS_HOST,
                port: Number(process.env.REDIS_PORT),
            },
        })

        this.redisClient.on('error', (err) => {
            console.error(`[Error] Redis PubSub Client ${err}`)
        })

        this.redisClient.connect()
    }
}

export class RedisPubSub extends Redis {
    async subscribe(channel) {
        await this.redisClient.subscribe(channel, (message) => {
            console.log('message : ', message)
        })
        console.log('채널 연결 완료')
    }

    async unsubscribe(channel) {
        await this.redisClient.unsubscribe(channel)
    }
}
