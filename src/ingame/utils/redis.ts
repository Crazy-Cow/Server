import { createClient, RedisClientType } from 'redis'

export class Redis {
    client: RedisClientType
    constructor() {
        this.client = createClient({
            password: process.env.REDIS_PASSWORD,
            socket: {
                host: process.env.REDIS_HOST,
                port: Number(process.env.REDIS_PORT),
            },
        })

        this.client.on('error', (err) => {
            console.error(`[Error] Redis PubSub Client ${err}`)
        })

        this.client.connect()
    }
}
