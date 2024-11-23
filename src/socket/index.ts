import { Server, Socket } from 'socket.io'
import { OnEventData, OnEventName } from './types/on'
import { IngameController, OutgameController } from './controller'
import userService from '../service/users'

type SocketClientId = string

class SocketImplement {
    socket: Socket

    outgameCtrl: OutgameController
    ingameCtrl: IngameController

    constructor(socket: Socket) {
        this.socket = socket
        this.ingameCtrl = new IngameController({ socket })
        this.outgameCtrl = new OutgameController({
            socket,
            ingameCtrl: this.ingameCtrl,
        })
        this.register()
    }

    private register = () => {
        this.socket.on<OnEventName>('disconnect', this.handleDisconnect)
        this.outgameCtrl.register()
        this.ingameCtrl.register()
    }

    private handleDisconnect = (reason: OnEventData['disconnect']) => {
        console.log(`[${this.socket.id}] disconnect (${reason})`)
        this.outgameCtrl.disconnect()
        this.ingameCtrl.disconnect()
    }

    public logger = (msg: string, args?: OnEventData) => {
        console.log(
            `[${this.socket.id}] ${msg} ${args ? JSON.stringify(args) : ''}`
        )
    }
}

export function initSocket(io: Server) {
    io.use((socket, next) => {
        const clientId: SocketClientId = socket.handshake.auth.clientId
        if (!clientId) {
            return next(new Error('[clientId] required'))
        }
        socket.data.clientId = clientId
        next()
    })

    io.use((socket, next) => {
        const userId = socket.data.clientId

        const player = userService.findUserById(userId)
        if (!player) {
            return next(new Error('로비 입장 필요'))
        }
        if (player.roomId) {
            console.log('reconnect')
            socket.join(player.roomId)
        }
        next()
    })

    io.on<OnEventName>('connection', (socket: Socket) => {
        // const clientId = socket.data.clientId
        // socket.on<OnEventName>('reconnect', () => {
        //     socketClientManager.addOrUpdateClient(clientId, socket.id)
        // })

        const instance = new SocketImplement(socket)
        instance.logger('complete connection')
    })
}
