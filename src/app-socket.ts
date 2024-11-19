import cors from 'cors'
import express from 'express'
import http from 'http'
import socketIo, { Socket } from 'socket.io'
import dotenv from 'dotenv'
import routes from './routes'
import cookieParser from 'cookie-parser'

dotenv.config()

const clients = new Map<string, string>() // 세션 ID를 저장: { clientId -> socketId }

// Express 앱 생성
const app = express()
app.use(cookieParser())
app.use(express.json())
app.use(cors({ origin: '*' }))
app.use('/user', routes.user)
const server = http.createServer(app)
const io = new socketIo.Server(server, { cors: { origin: '*' } })
import userService from './service/users'
import roomService, { Room } from './service/rooms'
import { EmitEventData, EmitEventName } from 'socket/types/emit'
import { Character } from 'game/objects/player'
import { OnEventData } from 'socket/types/on'
import { CommonMap } from 'game/maps'

function getRoomStateDto(room: Room): EmitEventData['room.changeState'] {
    return {
        roomId: room.roomId,
        playerCnt: room.players.length,
        state: room.state,
        maxPlayerCnt: room.maxPlayerCnt,
    }
}

function handleMove(character: Character, data: OnEventData['move']) {
    character.shift = data.shift
    character.position = data.character.position
    character.velocity = data.character.velocity
    character.isOnGround = data.character.isOnGround
}

let gameMap: CommonMap

const wrappedHandleMove = (data: OnEventData['move'], socket: Socket) => {
    const userId = socket.data.clientId
    const character = gameMap.findCharacter(userId)
    handleMove(character, data)
}

// 방 상태 브로드캐스트
const broadcastRoomState = (room: Room) => {
    const data = getRoomStateDto(room)
    io.to(room.roomId).emit('room.changeState', data) // 방 상태를 해당 방의 모든 클라이언트에게 전달
}

const handleRoomEnter = (socket: Socket) => {
    const broadcast = (
        roomId: string,
        emitMessage: EmitEventName,
        data: unknown
    ) => {
        // roomId에 속한 클라이언트들의 socket.id 리스트를 서버에서 가져오기
        // const clientsInRoom = io.sockets.adapter.rooms.get(roomId)
        // console.log('clientsInRoom', clientsInRoom)

        // self
        socket.emit<EmitEventName>(emitMessage, data)

        // the other
        socket.to(roomId).emit<EmitEventName>(emitMessage, data)
    }

    const userId = socket.data.clientId
    const player = userService.findUserById(userId) // userService에서 유저 찾기
    if (!player) {
        console.error(`User with socketId ${userId} not found.`)
        return
    }

    const room = roomService.joinRoom(player) // roomService에서 방에 유저 추가
    socket.join(room.roomId) // 해당 방에 유저 소켓을 입장시킴
    broadcastRoomState(room) // 방 상태 브로드캐스트

    if (room.state === 'playing') {
        // 게임 시작 상태인 경우 게임을 시작 처리
        console.log(`게임이 시작됩니다: ${room.roomId}`)
        // 이 부분에서 게임 시작 처리 로직을 넣을 수 있음

        broadcast(room.roomId, 'game.start', { players: room.players })

        room.loadGame()
        gameMap = room.gameMap
        room.startGameLoop({
            handleGameState: (data) => {
                broadcast(room.roomId, 'game.state', data)
            },
            handleGameOver: () => {
                broadcast(room.roomId, 'game.over', undefined)
            },
        })
    }
}

const handleRoomLeave = (socket: Socket) => {
    const userId = socket.data.clientId
    const room = roomService.leaveRoom(userId)
    broadcastRoomState(room)
}

io.use((socket, next) => {
    const clientId = socket.handshake.auth.clientId // 클라이언트가 보낸 clientId를 가져옵니다.

    if (!clientId) {
        return next(new Error('clientId 가 필요합니다.')) // clientId가 없으면 연결을 거부
    }

    // 세션 유효하면 소켓에 세션 정보를 추가하고 인증을 허용
    socket.data.clientId = clientId // 소켓 객체에 세션 정보를 저장
    clients.set(clientId, socket.id) // clientId와 socket.id를 맵에 저장
    next()
})

// 클라이언트 연결 시
io.on('connection', (socket) => {
    const clientId = socket.data.clientId
    if (clients.get(clientId)) {
        const userId = clientId
        const player = userService.findUserById(userId) // userService에서 유저 찾기
        if (!player) {
            console.error(`User with socketId ${userId} not found.`)
            return
        }

        socket.join(player.roomId) // 해당 방에 유저 소켓을 재입장
    }

    clients.set(clientId, socket.id)

    console.log('clients', clients)

    // 클라이언트가 보낸 메시지 처리
    socket.on('client_message', (message) => {
        console.log('클라이언트 메시지:', message)
    })

    // 연결 끊어졌을 때 처리
    socket.on('disconnect', (reason) => {
        console.log(
            `클라이언트 ${socket.id}가 연결을 끊었습니다. 이유: ${reason}`
        )

        // 연결이 끊어졌을 때만 세션을 삭제 (영구적인 연결 종료)
        if (reason === 'transport close') {
            console.log('TODO: 완전한 disconnect 판단 후 clients.delete 필요함')
        }
    })

    // 재연결 시도 처리
    socket.on('reconnect', () => {
        console.log(`클라이언트 ${socket.id}가 재연결됨. 세션 ID: ${clientId}`)
        // 재연결 시에도 기존 clientId에 맞게 새 socket.id로 갱신됩니다.
        clients.set(clientId, socket.id)
    })

    socket.on('room.enter', () => {
        handleRoomEnter(socket)
    })

    socket.on('room.leave', () => {
        handleRoomLeave(socket)
    })

    // 클라이언트가 보낸 "move" 이벤트 처리
    socket.on('move', (data) => {
        wrappedHandleMove(data, socket) // 여기서 handleMove2를 호출
    })
})

// 서버 시작
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중`)
})

// =====================================
