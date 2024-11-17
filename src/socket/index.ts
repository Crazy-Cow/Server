import { Server, Socket } from 'socket.io'
import { SocketEmitEvtTypeNew, SOCKET_ON_EVT_TYPE } from './constant'
import { SocketOnEvtData } from './type'
import roomService, { Room } from '../service/rooms'
import userService from '../service/users'
import util from './index.util'
import { CommonMap } from '../game/maps'
import { SocketMoveData } from 'game/server/index.type'
import inGameSocketHandler from '../game/server/index.util'

class SocketImplement {
    socket: Socket
    gameMap: CommonMap

    constructor(socket: Socket) {
        this.socket = socket
        this.register()
    }

    private register = () => {
        this.socket.on(SOCKET_ON_EVT_TYPE.DISCONNECT, this.handleDisconnect)
        this.socket.on(SOCKET_ON_EVT_TYPE.ROOM_ENTER, this.handleRoomEnter)
        this.socket.on(SOCKET_ON_EVT_TYPE.ROOM_LEAVE, this.handleRoomLeave)
        this.socket.on(SOCKET_ON_EVT_TYPE.MOVE, this.handleMove)
        this.logger('eventHandlers registered')
    }

    private handleDisconnect = (args: SocketOnEvtData['disconnect']) => {
        this.logger('disconnect', args)
        const userId = this.socket.id
        const room = roomService.leaveRoom(userId)
        userService.removeUser(userId)
        this.broadcastRoomState(room)

        // ingame
        if (this.gameMap) {
            this.gameMap.removeCharacter(this.socket.id)
        }
    }

    private broadcast = (
        roomId: string,
        emitMessage: SocketEmitEvtTypeNew,
        data: unknown // TODO: emitMessage에 따른 data 타입 결정하기
    ) => {
        this.logger(`roomId${roomId}, emitMessage: ${emitMessage}`)

        // self
        this.socket.emit(emitMessage, data)

        // the other
        this.socket.to(roomId).emit(emitMessage, data)
    }

    private handleRoomEnter = (args: SocketOnEvtData['room.enter']) => {
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

    private handleRoomLeave = (args: SocketOnEvtData['room.leave']) => {
        this.logger('room.leave', args)
        const userId = this.socket.id
        const room = roomService.leaveRoom(userId)
        this.broadcastRoomState(room)
    }

    private handleMove = (data: SocketMoveData) => {
        const character = this.gameMap.findCharacter(this.socket.id)
        inGameSocketHandler.handleMove(character, data)
    }

    private broadcastRoomState = (room: Room) => {
        const data = util.getRoomStateDto(room)
        this.broadcast(room.roomId, 'room.changeState', data)
    }

    private handleStartGame = (room: Room) => {
        this.gameMap = room.gameMap
        this.gameMap.addCharacter(this.socket.id)

        this.broadcast(room.roomId, 'game.start', undefined)
        room.startGameLoop({
            handleGameStateV1: (data) => {
                this.broadcast(room.roomId, 'characters', data)
            },
            handleGameStateV2: (data) => {
                this.broadcast(room.roomId, 'game.state', data)
            },
            handleGameOver: () => {
                this.broadcast(room.roomId, 'game.over', undefined)
            },
        })
    }

    public logger = (msg: string, args?: SocketOnEvtData) => {
        console.log(
            `[${this.socket.id}] ${msg} ${args ? JSON.stringify(args) : ''}`
        )
    }
}

export function initSocket(io: Server): void {
    const root = io.of('/')

    root.on(SOCKET_ON_EVT_TYPE.CONNECT, (socket: Socket) => {
        const instance = new SocketImplement(socket)
        instance.logger('complete connection')
    })
}
