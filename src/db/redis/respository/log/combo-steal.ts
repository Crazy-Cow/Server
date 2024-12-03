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

    const tripleKey = getLogGRCUKey({
        ...props,
        category: 'combo-steal-triple',
    })

    const multipleKey = getLogGRCUKey({
        ...props,
        category: 'combo-steal-multiple',
    })

    if (comboCnt == 2) {
        await redisClient.hIncrBy(doubleKey, userId, 1)
    } else if (comboCnt == 3) {
        await redisClient.hIncrBy(doubleKey, userId, -1)
        await redisClient.hIncrBy(tripleKey, userId, 1)
    } else if (comboCnt >= 4) {
        await redisClient.hIncrBy(tripleKey, userId, -1)
        await redisClient.hIncrBy(multipleKey, userId, 1)
    }
}

async function getDoubleCombos(roomId: string, userId: string) {
    const cntStr = await redisClient.hGet(
        getLogGRCUKey({ roomId, userId, category: 'combo-steal-double' }),
        userId
    )

    const cnt = Number(cntStr)
    if (isNaN(cnt)) return 0
    return cnt
}

async function getTripleCombos(roomId: string, userId: string) {
    const cntStr = await redisClient.hGet(
        getLogGRCUKey({ roomId, userId, category: 'combo-steal-triple' }),
        userId
    )

    const cnt = Number(cntStr)
    if (isNaN(cnt)) return 0
    return cnt
}

async function getMultipleCombos(roomId: string, userId: string) {
    const cntStr = await redisClient.hGet(
        getLogGRCUKey({ roomId, userId, category: 'combo-steal-multiple' }),
        userId
    )

    const cnt = Number(cntStr)
    if (isNaN(cnt)) return 0
    return cnt
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
    getDoubleCombos,
    getTripleCombos,
    getMultipleCombos,
}

export default logComboStealRepository
