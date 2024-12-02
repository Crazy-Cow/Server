import { Server, Socket } from 'socket.io'
import { OnEventData, OnEventName } from './types/on'
import { IngameController, OutgameController } from './controller'
import { verifyToken } from '../utils/jwt'
import roomService from '../service/rooms'

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
        socket.data.clientId = socket.handshake.auth.clientId
        socket.data.nickName = socket.handshake.auth.clientId
        socket.data.isGuest = true
        socket.data.roomId = undefined
        // (끝) will be deprecated ============

        const accessToken: SocketAccessToken = socket.handshake.auth.accessToken
        if (accessToken) {
            const { userId, nickName, isGuest } = verifyToken(accessToken)
            socket.data.clientId = userId
            socket.data.nickName = nickName
            socket.data.isGuest = isGuest
        } else {
            // TODO: 만료 시 에러 처리
        }

        if (!socket.data.clientId) {
            return next(new Error('[clientId] required'))
        }

        console.log('[connect]', socket.data.clientId)

        next()
    })

    io.use(async (socket, next) => {
        const userId = socket.data.clientId
        const roomId = await roomService.getGameRoomIdByUserId(userId)
        if (roomId) {
            console.log('게임중 - reconnect')
            socket.join(roomId)
            socket.data.roomId = roomId
        }
        next()
    })

    io.on<OnEventName>('connection', (socket: Socket) => {
        const instance = new SocketImplement(socket)
        instance.logger('complete connection')
    })
}
