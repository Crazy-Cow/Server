import { redisClient } from '..'

type LogCategory = 'event' | 'steal' | 'combo-steal'
const createRoomKey = (props: { roomId: string; category: LogCategory }) =>
    `game:${props.roomId}:${props.category}`

const createComboKey = (props: {
    roomId: string
    category: LogCategory
    userId: string
}) => `${createRoomKey(props)}:${props.userId}`

const createError = (method: string, err: unknown) => {
    return new Error(`[REDIS] ${method} failed\n${err}`)
}

type CommonEvent = {
    action: 'steal'
    timeStamp: number
}

export type StealEvent = {
    roomId: string
    actorId: string
    victimId: string
}

const COMBO_INTERVAL_SEC = 10

async function acquireCombo(props: { roomId: string; userId: string }) {
    const comboKey = createComboKey({ ...props, category: 'combo-steal' })

    const comboCntStr = await redisClient.get(comboKey)
    let comboCnt = 0

    if (comboCntStr) {
        comboCnt = parseInt(comboCntStr, 10) + 1
    } else {
        comboCnt = 1
    }

    await redisClient.set(comboKey, comboCnt, {
        EX: COMBO_INTERVAL_SEC,
    })

    return comboCnt
}

async function resetCombo(props: { roomId: string; userId: string }) {
    const comboKey = createComboKey({ ...props, category: 'combo-steal' })
    await redisClient.del(comboKey)
    return 0
}

const addSteal = async (
    props: StealEvent
): Promise<{ comboMessage: string }> => {
    try {
        const roomId = props.roomId
        const actorId = props.actorId
        const timeStamp = Date.now()

        const comboCount = await acquireCombo({ roomId, userId: props.actorId })
        await resetCombo({ roomId, userId: props.victimId })

        const data: CommonEvent & StealEvent = {
            ...props,
            action: 'steal',
            timeStamp,
        }
        const serialized = JSON.stringify(data)
        await redisClient.rPush(
            createRoomKey({ roomId, category: 'event' }),
            serialized
        )

        await redisClient.hIncrBy(
            createRoomKey({ roomId, category: 'steal' }),
            actorId,
            1
        )

        let comboMessage = ''
        if (comboCount == 2) comboMessage = 'double'
        else if (comboCount == 3) comboMessage = 'triple'

        // TODO: Add category: 'event'

        return { comboMessage }
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
