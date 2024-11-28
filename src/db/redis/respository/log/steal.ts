import { createError } from './index.util'
import logComboStealRepository from './combo-steal'
import { LogCategory, StealLogProps } from './index.type'
import logEventRepository from './event'
import { getLogGRCKey } from './index.util'
import { redisClient } from '../../../../db/redis'
import { StealComboType } from 'socket/types/emit'

const category: LogCategory = 'steal'

// TODO: API 플레이 요약
const increaseSteal = async ({
    roomId,
    actorId,
}: {
    roomId: string
    actorId: string
}) => redisClient.hIncrBy(getLogGRCKey({ roomId, category }), actorId, 1)

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

        await increaseSteal({ roomId, actorId })

        await logEventRepository.addEvent(category, props)

        let comboMessage
        if (comboCnt == 2) comboMessage = 'double'
        else if (comboCnt == 3) comboMessage = 'triple'

        // TODO: Add category: 'event'

        return { comboMessage }
    } catch (err) {
        createError('addSteal', err)
    }
}

const logStealRepository = {
    handleSteal,
}

export default logStealRepository
