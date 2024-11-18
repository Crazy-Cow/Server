import { Server, Socket } from 'socket.io'
import { EmitEventName } from './types/emit'
import roomService, { Room } from '../service/rooms'
import userService from '../service/users'
import util from './index.util'
import { CommonMap } from '../game/maps'
import inGameSocketHandler from '../game/server/index.util'
import { OnEventData, OnEventName } from './types/on'

class SocketImplement {
    socket: Socket
    gameMap: CommonMap

    constructor(socket: Socket) {
        this.socket = socket
        this.register()
    }

    private register = () => {
        this.socket.on<OnEventName>('disconnect', this.handleDisconnect)
        this.socket.on<OnEventName>('room.enter', this.handleRoomEnter)
        this.socket.on<OnEventName>('room.leave', this.handleRoomLeave)
        this.socket.on<OnEventName>('move', this.handleMove)
        this.logger('eventHandlers registered')
    }

    private handleDisconnect = (args: OnEventData['disconnect']) => {
        this.logger('disconnect', args)
        const userId = this.socket.id
        const room = roomService.leaveRoom(userId)
        userService.removeUser(userId)

        if (room) {
            // user가 존재하던 room
            this.broadcastRoomState(room)
        }

        // ingame
        if (this.gameMap) {
            this.gameMap.removeCharacter(this.socket.id)
        }
    }

    private broadcast = (
        roomId: string,
        emitMessage: EmitEventName,
        data: unknown // TODO: emitMessage에 따른 data 타입 결정하기
    ) => {
        // this.logger(`roomId${roomId}, emitMessage: ${emitMessage}`)

        // self
        this.socket.emit<EmitEventName>(emitMessage, data)

        // the other
        this.socket.to(roomId).emit<EmitEventName>(emitMessage, data)
    }

    private handleRoomEnter = (args: OnEventData['room.enter']) => {
        this.logger('room.enter', args)
        const userId = this.socket.id
        const player = userService.findUserById(userId)
        const room = roomService.joinRoom(player)
        this.socket.join(room.roomId)
        this.broadcastRoomState(room)

        if (room.state === 'playing') {
            this.handleStartGame(room)
        }
    }

    private handleRoomLeave = (args: OnEventData['room.leave']) => {
        this.logger('room.leave', args)
        const userId = this.socket.id
        const room = roomService.leaveRoom(userId)
        this.broadcastRoomState(room)
    }

    private handleMove = (data: OnEventData['move']) => {
        const character = this.gameMap.findCharacter(this.socket.id)
        inGameSocketHandler.handleMove(character, data)
    }

    private broadcastRoomState = (room: Room) => {
        const data = util.getRoomStateDto(room)
        this.broadcast(room.roomId, 'room.changeState', data)
    }

    private handleStartGame = (room: Room) => {
        this.gameMap = room.gameMap
        this.broadcast(room.roomId, 'game.start', { players: room.players })

        room.loadGame()

        room.startGameLoop({
            handleGameState: (data) => {
                this.broadcast(room.roomId, 'game.state', data)
            },
            handleGameOver: () => {
                this.broadcast(room.roomId, 'game.over', undefined)
            },
        })
    }

    public logger = (msg: string, args?: OnEventData) => {
        console.log(
            `[${this.socket.id}] ${msg} ${args ? JSON.stringify(args) : ''}`
        )
    }
}

export function initSocket(io: Server): void {
    const root = io.of('/')

    root.on<OnEventName>('connection', (socket: Socket) => {
        const instance = new SocketImplement(socket)
        instance.logger('complete connection')
    })
}
