/**
 * (Cache) 인게임 유저 세션 관리 (재접속 시 room re-join 되도록)
 */

import { redisClient } from '..'

const COMMON_KEY = 'user-room'
const createKey = (userId: string) => `${COMMON_KEY}:${userId}`
const createError = (method: string, err: unknown) => {
    return new Error(`[REDIS]${COMMON_KEY}: ${method} failed\n${err}`)
}

const getGameRoomId = async (userId: string) => {
    try {
        return await redisClient.get(createKey(userId))
    } catch (err) {
        createError('getGameRoomId', err)
    }
}

const setGameRoomId = async (userId: string, roomId: string) => {
    try {
        await redisClient.set(createKey(userId), roomId, { EX: 5 * 60 })
    } catch (err) {
        createError('setGameRoomId', err)
    }
}

const resetGameRoomId = async (userId: string) => {
    try {
        await redisClient.del(createKey(userId))
    } catch (err) {
        createError('resetGameRoomId', err)
    }
}

export type GameRoomRepository = {
    getGameRoomId: typeof getGameRoomId
    setGameRoomId: typeof setGameRoomId
    resetGameRoomId: typeof resetGameRoomId
}

const gameRoomRepository: GameRoomRepository = {
    getGameRoomId,
    setGameRoomId,
    resetGameRoomId,
}

export default gameRoomRepository
