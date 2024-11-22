import { Server, Socket } from 'socket.io'
import { OnEventData, OnEventName } from './types/on'
import { OutgameController } from './controller'
import userService from '../service/users'
import SocketClientManager, {
    SocketClientId,
} from '../../socket/client-manager'
const socketClientManager = new SocketClientManager()

class SocketImplement {
    socket: Socket
    outgameCtrl: OutgameController

    constructor(socket: Socket) {
        this.socket = socket
        this.outgameCtrl = new OutgameController({ socket })
        this.register()
    }

    private register = () => {
        this.socket.on<OnEventName>('disconnect', this.handleDisconnect)
        this.outgameCtrl.register()
    }

    private handleDisconnect = (reason: OnEventData['disconnect']) => {
        console.log(`[${this.socket.id}] disconnect (${reason})`)
        // // 연결이 끊어졌을 때만 세션을 삭제 (영구적인 연결 종료)
        // if (reason === 'transport close') {
        //     console.log('TODO: 완전한 disconnect 판단 후 clients.delete 필요함')
        // }
        // this.logger('disconnect', args)
        // this.outgameCtrl.disconnect()
        // this.ingameCtrl.disconnect()
    }

    public logger = (msg: string, args?: OnEventData) => {
        console.log(
            `[${this.socket.id}] ${msg} ${args ? JSON.stringify(args) : ''}`
        )
    }
}

export function initOutGameSocket(io: Server) {
    io.use((socket, next) => {
        const clientId: SocketClientId = socket.handshake.auth.clientId
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
        if (roomId) {
            console.log('reconnect')
            socket.join(roomId)
        }

        next()
    })

    io.on<OnEventName>('connection', (socket: Socket) => {
        const clientId = socket.data.clientId

        socket.on<OnEventName>('reconnect', () => {
            socketClientManager.addOrUpdateClient(clientId, socket.id)
        })

        const instance = new SocketImplement(socket)
        instance.logger('complete connection')
    })
}
