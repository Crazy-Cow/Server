import { createError, getLogGRCUKey } from './index.util'
import { LogCategory, MoveLogProps } from './index.type'
import { redisClient } from '../../../../db/redis'

const category: LogCategory = 'move'

const handleMove = async (props: MoveLogProps) => {
    try {
        const roomId = props.roomId
        const userId = props.userId
        const key = getLogGRCUKey({ roomId, userId, category })
        const serialized = JSON.stringify(props)
        await redisClient.rPush(key, serialized)
    } catch (err) {
        createError('handleMove', err)
    }
}

const loadMove = async (roomId: string, userId: string) => {
    try {
        const key = getLogGRCUKey({ roomId, userId, category })
        const serializedLogs = await redisClient.lRange(key, 0, -1)

        return serializedLogs
    } catch (err) {
        createError('loadMove', err)
    }
}

const logMoveRepository = {
    handleMove,
    loadMove,
}

export default logMoveRepository
