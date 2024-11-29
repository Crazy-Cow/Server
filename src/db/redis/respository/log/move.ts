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

const logMoveRepository = {
    handleMove,
}

export default logMoveRepository
