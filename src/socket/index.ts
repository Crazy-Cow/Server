import { Server, Socket } from 'socket.io'
import { SOCKET_ON_EVT_TYPE } from './constant'
import { SocketOnEvtData } from './type'
import roomService from '../service/rooms'
import userService from 'service/users'

class SocketImplement {
    socket: Socket

    constructor(socket: Socket) {
        this.socket = socket
        this.register()
    }

    private register = () => {
        this.socket.on(SOCKET_ON_EVT_TYPE.ROOM_ENTER, this.handleRoomEnter)
        this.socket.on(SOCKET_ON_EVT_TYPE.ROOM_LEAVE, this.handleRoomLeave)
        this.logger('event handler register')
    }

    private handleRoomEnter = (args: SocketOnEvtData['room.enter']) => {
        this.logger('room.enter', args)
        const userId = this.socket.id
        const player = userService.findUserById(userId)
        roomService.joinRoom(player)
    }

    private handleRoomLeave = (args: SocketOnEvtData['room.leave']) => {
        this.logger('room.leave', args)
        const userId = this.socket.id
        roomService.leaveRoom(userId)
    }

    public logger = (msg: string, args?: SocketOnEvtData) => {
        console.log(
            `[${this.socket.id}] ${msg} ${args ? JSON.stringify(args) : ''}`
        )
    }
}

export function initSocket(io: Server): void {
    const root = io.of('/')

    root.on('connection', (socket: Socket) => {
        const instance = new SocketImplement(socket)
        instance.logger('complete connection')
    })
}
