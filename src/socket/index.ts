import { Server, Socket } from 'socket.io'
import { SOCKET_EMIT_EVT_TYPE, SOCKET_ON_EVT_TYPE } from './constant'
import { SocketOnEvtData } from './type'
import roomService, { Room } from '../service/rooms'
import userService from '../service/users'
import util from './index.util'

class SocketImplement {
    socket: Socket

    constructor(socket: Socket) {
        this.socket = socket
        this.register()
    }

    private register = () => {
        this.socket.on(SOCKET_ON_EVT_TYPE.DISCONNECT, this.handleDisconnect)
        this.socket.on(SOCKET_ON_EVT_TYPE.ROOM_ENTER, this.handleRoomEnter)
        this.socket.on(SOCKET_ON_EVT_TYPE.ROOM_LEAVE, this.handleRoomLeave)
        this.logger('eventHandlers registered')
    }

    private handleDisconnect = (args: SocketOnEvtData['disconnect']) => {
        this.logger('disconnect', args)
        const userId = this.socket.id
        const room = roomService.leaveRoom(userId)
        userService.removeUser(userId)
        this.broadcastRoomState(room)
    }

    private handleRoomEnter = (args: SocketOnEvtData['room.enter']) => {
        this.logger('room.enter', args)
        const userId = this.socket.id
        const player = userService.findUserById(userId)
        const room = roomService.joinRoom(player)
        this.socket.join(room.roomId)
        this.broadcastRoomState(room)

        if (room.state == 'playing') {
            this.socket.to(room.roomId).emit(SOCKET_EMIT_EVT_TYPE.GAME_START)
        }
    }

    private handleRoomLeave = (args: SocketOnEvtData['room.leave']) => {
        this.logger('room.leave', args)
        const userId = this.socket.id
        const room = roomService.leaveRoom(userId)
        this.broadcastRoomState(room)
    }

    private broadcastRoomState = (room: Room) => {
        const data = util.getRoomStateDto(room)

        // self
        this.socket.emit(SOCKET_EMIT_EVT_TYPE.ROOM_CHANGE_STATE, data)

        // the other
        this.socket
            .to(room.roomId)
            .emit(SOCKET_EMIT_EVT_TYPE.ROOM_CHANGE_STATE, data)
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
