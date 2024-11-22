import { redisClient } from '..'
import { Room } from '../../../service/rooms'

const COMMON_KEY = 'game-room'
const createRoomKey = (roomId: string) => `${COMMON_KEY}:${roomId}`
const createError = (method: string, error: unknown) => {
    return new Error(`[REDIS]${COMMON_KEY}: ${method} failed\n${error}`)
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
    console.log('TODO: findById', roomId)
    // const result = await redisClient.hGetAll(createRoomKey(roomId))
    const room = new Room({}) // TODO: Load players from outgame to ingame

    return room
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
