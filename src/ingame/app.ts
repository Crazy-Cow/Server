import dotenv from 'dotenv'
dotenv.config()

import { Server } from 'socket.io'
import { Character } from './game/objects/player'
import { EmitEventName } from './types/emit'
import { OnEventName, OnEventData } from './types/on'
import gameRoomService from './service/game-room'
import redisManager from '../db/redis/redis-manager'
import SocketClientManager from '../socket/client-manager'
import userService from './service/user'
;(async () => {
    await redisManager.common
        .connect()
        .then(() => console.log('[1] (common) Redis Connected'))

    await redisManager.ingame
        .connect()
        .then(() => console.log('[2] (ingame) Redis Connected'))
})()

const socketClientManager = new SocketClientManager()

const port = Number(process.env.INGAME_PORT)
const io = new Server(port, { cors: { origin: '*' } })

io.use((socket, next) => {
    const clientId = socket.handshake.auth.clientId

    if (!clientId) {
        return next(new Error('[clientId] required'))
    }

    socket.data.clientId = clientId
    socketClientManager.addOrUpdateClient(clientId, socket.id)
    next()
})

io.use(async (socket, next) => {
    const userId = socket.data.clientId

    const player = await userService.findUserById(userId)
    if (!player) {
        return next(new Error('로비 입장 필요'))
    }

    const roomId = player.roomId
    if (!roomId) {
        next(new Error('대기실 입장 필요'))
    } else {
        socket.join(roomId)
        socket.data.roomId = roomId
        next()
    }
})

function handleMove(character: Character, data: OnEventData['move']) {
    character.shift = data.shift
    character.position = data.character.position
    character.velocity = data.character.velocity
    character.isOnGround = data.character.isOnGround
}

io.on('connection', (socket) => {
    const userId = socket.data.clientId
    const roomId = socket.data.roomId

    socket.join(roomId)
    socket.on<OnEventName>('move', async (data: OnEventData['move']) => {
        const room = await gameRoomService.findById(roomId)
        const character = room.gameMap.findCharacter(userId)
        handleMove(character, data)
    })
})

redisManager.ingame.subscribe('game.ready', async (roomId: string) => {
    console.log('[redis sub] game.ready', roomId)
    const room = await gameRoomService.createRoom(roomId)
    room.startGame(io)
    io.to(roomId).emit<EmitEventName>('ingame.start')
})
