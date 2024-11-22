import dotenv from 'dotenv'
dotenv.config()

import { Server } from 'socket.io'
import { Character } from './game/objects/player'
import socketClientManager from './utils/client-manager'
import { Redis } from './utils/redis'
import { EmitEventName } from './types/emit'
import { OnEventName, OnEventData } from './types/on'
import gameRoomService from './service/game-room'
import { connectRedisDB } from '../db/redis'
;(async () => {
    await connectRedisDB().then(() => console.log('[1] Redis DB Connected'))
})()

const io = new Server(9000, { cors: { origin: '*' } })
const redis = new Redis()

io.use((socket, next) => {
    const clientId = socket.handshake.auth.clientId
    const roomId = socket.handshake.auth.roomId

    if (!clientId) {
        return next(new Error('[clientId] required'))
    }

    socket.data.clientId = clientId
    socket.data.roomId = roomId // TODO protocol 추가
    socketClientManager.addOrUpdateClient(clientId, socket.id)
    next()
})

function handleMove(character: Character, data: OnEventData['move']) {
    character.shift = data.shift
    character.position = data.character.position
    character.velocity = data.character.velocity
    character.isOnGround = data.character.isOnGround
}

io.on('connection', (socket) => {
    const userId = socket.data.clientId
    const roomId = socket.data.clientId
    socket.join(roomId)
    socket.on<OnEventName>('move', async (data: OnEventData['move']) => {
        const room = await gameRoomService.findById(roomId)
        const character = room.gameMap.findCharacter(userId)
        handleMove(character, data)
    })
})

redis.client.subscribe('game.ready', async (roomId: string) => {
    console.log('[redis sub] game.ready', roomId)
    const room = await gameRoomService.createRoom(roomId)
    room.startGame(io)
    io.to(roomId).emit<EmitEventName>('ingame.start')
})
