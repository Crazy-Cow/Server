import { redisClient } from '../..'
import { LogCategory } from './index.type'
import { getLogGRCUKey } from './index.util'

const category: LogCategory = 'combo-steal'

const COMBO_EXPIRE_SEC = 10

async function acquireCombo(props: { roomId: string; userId: string }) {
    const comboKey = getLogGRCUKey({ ...props, category })

    const comboCntStr = await redisClient.get(comboKey)
    let comboCnt = 0

    if (comboCntStr) {
        comboCnt = parseInt(comboCntStr, 10) + 1
    } else {
        comboCnt = 1
    }

    await redisClient.set(comboKey, comboCnt, { EX: COMBO_EXPIRE_SEC })

    return { comboCnt }
}

async function resetCombo(props: { roomId: string; userId: string }) {
    const comboKey = getLogGRCUKey({ ...props, category })
    await redisClient.del(comboKey)

    return
}

const logComboStealRepository = {
    acquireCombo,
    resetCombo,
}

export default logComboStealRepository
