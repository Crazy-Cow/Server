import { RedisUser } from '../models/user'
import redisManager from '../redis-manager'

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
        await redisManager.common.hSet(createUserKey(user.userId), {
            nickName: user.nickName,
            roomId: user.roomId,
        })
        await redisManager.common.sAdd(REDIS_NICKNAMES, user.nickName)
    } catch (err) {
        throw createError('create', err)
    }
}

const updateRoomId = async (props: { userId: string; roomId: string }) => {
    await redisManager.common.hSet(
        createUserKey(props.userId),
        'roomId',
        props.roomId
    )
}

const findById = async (userId: string): Promise<RedisUser> => {
    const result = await redisManager.common.hGetAll(createUserKey(userId))

    if (!result || Object.keys(result).length === 0) {
        return null
    }

    const user = new RedisUser({
        userId,
        nickName: result.nickName,
        roomId: result.roomId,
    })
    return user
}

const remove = async (userId: string) => {
    try {
        const user = await findById(userId)
        if (!user) throw new Error('User not found')
        await redisManager.common.del(createUserKey(userId))
        await redisManager.common.sRem(REDIS_NICKNAMES, user.nickName)
    } catch (err) {
        throw createError('delete', err)
    }
}

const isDupNick = async (nickName: string) => {
    const exists = await redisManager.common.sIsMember(
        REDIS_NICKNAMES,
        nickName
    )
    return exists
}

export type UserRepository = {
    createAndSave: typeof createAndSave
    findById: typeof findById
    updateRoomId: typeof updateRoomId
    remove: typeof remove
    isDupNick: typeof isDupNick
}

const userRepository: UserRepository = {
    createAndSave,
    findById,
    updateRoomId,
    remove,
    isDupNick,
}

export default userRepository
