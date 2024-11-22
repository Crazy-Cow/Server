import { redisClient } from '..'
import { Room } from '../../../service/rooms'

const COMMON_KEY = 'game-room'
const createRoomKey = (roomId: string) => `${COMMON_KEY}:${roomId}`
const createError = (method: string, error: unknown) => {
    const message = `[REDIS]${COMMON_KEY}: ${method} failed\n${error}`
    console.log(message)
    return new Error(message)
}

const createAndSave = async (room: Room) => {
    const players = room.players

    try {
        for (const player of players) {
            await redisClient.sAdd(createRoomKey(room.roomId), player.userId)
        }
    } catch (err) {
        throw createError('create', err)
    }
}

const findById = async (roomId: string) => {
    try {
        const result = await redisClient.sMembers(createRoomKey(roomId))
        return result
    } catch (err) {
        throw createError('findById', err)
    }
}

export type RoomRepository = {
    createAndSave: typeof createAndSave
    findById: typeof findById
}

const roomRepository: RoomRepository = {
    createAndSave,
    findById,
}

export default roomRepository
