import { redisClient } from '..'
import { RedisGameRoom } from '../models/room'

const COMMON_KEY = 'game-room'
const createRoomKey = (roomId: string) => `${COMMON_KEY}:${roomId}`
const createError = (method: string, error: unknown) => {
    const message = `[REDIS]${COMMON_KEY}: ${method} failed\n${error}`
    console.log(message)
    return new Error(message)
}

const createAndSave = async (room: RedisGameRoom) => {
    try {
        for (const id of room.playerIds) {
            await redisClient.sAdd(createRoomKey(room.roomId), id)
        }
    } catch (err) {
        throw createError('create', err)
    }
}

const getPlayerIds = async (
    roomId: string
): Promise<RedisGameRoom['playerIds']> => {
    try {
        const result = await redisClient.sMembers(createRoomKey(roomId))
        return result
    } catch (err) {
        throw createError('findById', err)
    }
}

export type RoomRepository = {
    createAndSave: typeof createAndSave
    getPlayerIds: typeof getPlayerIds
}

const roomRepository: RoomRepository = {
    createAndSave,
    getPlayerIds,
}

export default roomRepository
