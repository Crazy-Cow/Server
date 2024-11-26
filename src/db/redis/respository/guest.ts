import { verifyToken } from '../../../utils/jwt'
import { redisClient } from '..'

const COMMON_KEY = 'guest'
const createKey = (nickName: string) => `${COMMON_KEY}:${nickName}`
const createError = (method: string, err: unknown) => {
    return new Error(`[REDIS]${COMMON_KEY}: ${method} failed\n${err}`)
}

const addNick = async (token: string) => {
    try {
        const { exp, nickName } = verifyToken(token)
        await redisClient.set(createKey(nickName), token, { EX: exp })
    } catch (err) {
        createError('addNick', err)
    }
}

const removeNick = async (userId: string) => {
    try {
        await redisClient.del(createKey(userId))
    } catch (err) {
        createError('removeNick', err)
    }
}

const checkDupNick = async (nickName: string) => {
    try {
        const exists = await redisClient.get(createKey(nickName))
        return exists
    } catch (err) {
        createError('isDupNick', err)
    }
}

export type GuestRepository = {
    addNick: typeof addNick
    removeNick: typeof removeNick
    checkDupNick: typeof checkDupNick
}

const guestRepository: GuestRepository = {
    addNick,
    removeNick,
    checkDupNick,
}

export default guestRepository
