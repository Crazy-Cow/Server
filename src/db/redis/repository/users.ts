import { redisClient } from '..'
import { RedisUser } from '../models/user'

const COMMON_KEY = 'user'
const REDIS_NICKNAMES = `${COMMON_KEY}:nicknames`

const createUserKey = (userId: string) => `${COMMON_KEY}:${userId}`
const createError = (method: string, error: unknown) => {
    const message = `[REDIS]${COMMON_KEY}: ${method} failed\n${error}`
    console.log(message)
    return new Error(message)
}

const createAndSave = async (user: RedisUser) => {
    try {
        await redisClient.hSet(createUserKey(user.userId), {
            nickName: user.nickName,
        })
        await redisClient.sAdd(REDIS_NICKNAMES, user.nickName)
    } catch (err) {
        throw createError('create', err)
    }
}

const findById = async (userId: string): Promise<RedisUser> => {
    const result = await redisClient.hGetAll(createUserKey(userId))

    if (!result || Object.keys(result).length === 0) {
        return null
    }

    const user = new RedisUser(userId, result.nickName)
    return user
}

const remove = async (userId: string) => {
    try {
        const user = await findById(userId)
        if (!user) throw new Error('User not found')
        await redisClient.del(createUserKey(userId))
        await redisClient.sRem(REDIS_NICKNAMES, user.nickName)
    } catch (err) {
        throw createError('delete', err)
    }
}

const isDupNick = async (nickName: string) => {
    const exists = await redisClient.sIsMember(REDIS_NICKNAMES, nickName)
    return exists
}

export type UserRepository = {
    createAndSave: typeof createAndSave
    findById: typeof findById
    remove: typeof remove
    isDupNick: typeof isDupNick
}

const userRepository: UserRepository = {
    createAndSave,
    findById,
    remove,
    isDupNick,
}

export default userRepository
