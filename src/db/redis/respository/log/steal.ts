import { createError } from './index.util'
import logComboStealRepository from './combo-steal'
import { ComboStealLogProps, LogCategory, StealLogProps } from './index.type'
import logEventRepository from './event'
import { getLogGRCKey } from './index.util'
import { redisClient } from '../../../../db/redis'
import { StealComboType } from 'socket/types/emit'

const category: LogCategory = 'steal'

const increaseSteal = async (roomId: string, userId: string) =>
    redisClient.hIncrBy(getLogGRCKey({ roomId, category }), userId, 1)

const getLogAccSteal = async (roomId: string, userId: string) => {
    const cntStr = await redisClient.hGet(
        getLogGRCKey({ roomId, category }),
        userId
    )
    const cnt = Number(cntStr)
    if (isNaN(cnt)) return 0
    return cnt
}

const handleSteal = async (
    props: StealLogProps
): Promise<{ comboMessage?: StealComboType }> => {
    try {
        const roomId = props.roomId
        const actorId = props.actorId
        const victimId = props.victimId

        const { comboCnt } = await logComboStealRepository.acquireCombo({
            roomId,
            userId: actorId,
        })

        await logComboStealRepository.resetCombo({ roomId, userId: victimId })

        await increaseSteal(roomId, actorId)

        await logEventRepository.addEvent(category, props)

        let comboMessage: ComboStealLogProps['combo']
        if (comboCnt == 2) comboMessage = 'double'
        else if (comboCnt == 3) comboMessage = 'triple'
        else if (comboCnt >= 4) comboMessage = 'multiple'

        if (comboMessage) {
            const data: ComboStealLogProps = {
                actorId,
                combo: comboMessage,
                roomId,
                timeStamp: props.timeStamp,
            }
            await logEventRepository.addEvent('combo-steal', data)
        }

        return { comboMessage }
    } catch (err) {
        createError('addSteal', err)
    }
}

const logStealRepository = {
    handleSteal,
    getLogAccSteal,
}

export default logStealRepository
