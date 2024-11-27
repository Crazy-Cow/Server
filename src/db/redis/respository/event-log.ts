import { redisClient } from '..'

type LogCategory = 'event' | 'steal'
const createKey = (props: { roomId: string; category: LogCategory }) =>
    `game:${props.roomId}:${props.category}`
const createError = (method: string, err: unknown) => {
    return new Error(`[REDIS] ${method} failed\n${err}`)
}

type CommonEvent = {
    action: 'steal'
    timeStamp
}

export type StealEvent = {
    roomId: string
    actorId: string
    victimId: string
}

const addSteal = async (props: StealEvent) => {
    try {
        const roomId = props.roomId
        const actorId = props.actorId
        const timeStamp = Date.now()
        const data: CommonEvent & StealEvent = {
            ...props,
            action: 'steal',
            timeStamp,
        }
        const serialized = JSON.stringify(data)

        await redisClient.rPush(
            createKey({ roomId, category: 'event' }),
            serialized
        )

        await redisClient.hIncrBy(
            createKey({ roomId, category: 'steal' }),
            actorId,
            1
        )
    } catch (err) {
        createError('addSteal', err)
    }
}

export type EventLogRepository = {
    addSteal: typeof addSteal
}

const eventLogRepository: EventLogRepository = {
    addSteal,
}

export default eventLogRepository
