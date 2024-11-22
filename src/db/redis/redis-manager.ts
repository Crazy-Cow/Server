import { createClient, RedisClientType } from 'redis'

class Redis {
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
    }
}

class RedisManager {
    public ingame: RedisClientType
    public common: RedisClientType

    constructor() {
        this.ingame = new Redis().client
        this.common = new Redis().client
    }

    private static instance: RedisManager

    public static getInstance(): RedisManager {
        if (!this.instance) {
            this.instance = new RedisManager()
        }
        return this.instance
    }
}

const redisManager = RedisManager.getInstance()

export default redisManager
