import { redisClient } from '../../../../db/redis'
import { ComboStealLogProps, CommonLogProps, StealLogProps } from './index.type'
import { getLogGRCKey } from './index.util'

interface ActionDataMap {
    steal: StealLogProps
    'combo-steal': ComboStealLogProps
}

type ActionKeys = keyof ActionDataMap

export type AddEventProps<T extends ActionKeys> = CommonLogProps & {
    action: T
    data: ActionDataMap[T]
}

const addEvent = async <T extends ActionKeys>(
    action: T,
    data: ActionDataMap[T]
) => {
    const key = getLogGRCKey({ roomId: data.roomId, category: 'event' })
    const event = { action, data }
    const serialized = JSON.stringify(event)
    await redisClient.rPush(key, serialized)
}

const logEventRepository = {
    addEvent,
}

export default logEventRepository
