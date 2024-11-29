import { redisClient } from '../..'
import { LogCategory } from './index.type'
import { getLogGRCUKey } from './index.util'

async function saveCombo(props: {
    roomId: string
    userId: string
    comboCnt: number
}) {
    const { userId, comboCnt } = props
    const doubleKey = getLogGRCUKey({
        ...props,
        category: 'combo-steal-double',
    })

    if (comboCnt == 3) {
        await redisClient.hIncrBy(doubleKey, userId, -1)
        const tripleKey = getLogGRCUKey({
            ...props,
            category: 'combo-steal-triple',
        })
        await redisClient.hIncrBy(tripleKey, userId, 1)
    } else if (comboCnt == 2) {
        await redisClient.hIncrBy(doubleKey, userId, 1)
    }
}

const notSaveCategory: LogCategory = 'combo-steal-tmp'
const COMBO_EXPIRE_SEC = 10

async function acquireCombo(props: { roomId: string; userId: string }) {
    const notSaveComboKey = getLogGRCUKey({
        ...props,
        category: notSaveCategory,
    })

    const comboCntStr = await redisClient.get(notSaveComboKey)
    let comboCnt = 0

    if (comboCntStr) {
        comboCnt = parseInt(comboCntStr, 10) + 1
    } else {
        comboCnt = 1
    }

    await saveCombo({ ...props, comboCnt })
    await redisClient.set(notSaveComboKey, comboCnt, { EX: COMBO_EXPIRE_SEC })
    return { comboCnt }
}

async function resetCombo(props: { roomId: string; userId: string }) {
    const comboKey = getLogGRCUKey({ ...props, category: notSaveCategory })
    await redisClient.del(comboKey)

    return
}

const logComboStealRepository = {
    acquireCombo,
    resetCombo,
}

export default logComboStealRepository
