import { Server, Socket } from 'socket.io'
import { OnEventData, OnEventName } from './types/on'
import { IngameController, OutgameController } from './controller'
import userService from '../service/users'
import { verifyToken } from '../utils/jwt'

type SocketClientId = string
type SocketAccessToken = string

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
        // (시작) will be deprecated ============
        let clientId: SocketClientId = socket.handshake.auth.clientId
        // (끝) will be deprecated ============

        const accessToken: SocketAccessToken = socket.handshake.auth.accessToken
        if (accessToken) {
            const { userId } = verifyToken(accessToken)
            clientId = userId
        } else {
            // TODO: 만료 시 에러 처리
        }

        if (!clientId) {
            return next(new Error('[clientId] required'))
        }

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
        const instance = new SocketImplement(socket)
        instance.logger('complete connection')
    })
}
