import { Server, Socket } from 'socket.io'
import { OnEventData, OnEventName } from './types/on'
import { IngameController } from './controller'
import socketClientManager, { SocketClientId } from './service/client-manager'
import userService from '../../service/users'
import { RedisPubSub } from '../../db/redis/ingame'

class SocketImplement {
    socket: Socket

    ingameCtrl: IngameController

    constructor(socket: Socket) {
        this.socket = socket
        this.ingameCtrl = new IngameController({ socket })
        this.register()
    }

    private register = () => {
        this.socket.on<OnEventName>('disconnect', this.handleDisconnect)
        this.ingameCtrl.register()
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

export function initInGameSocket(io: Server) {
    // redisClient.unsubscribe('game.start')
    const subscriber = new RedisPubSub() // 구독자
    subscriber.subscribe('game.start')

    // redisClient.subscribe('game.start', (roomId) => {
    //     console.log('TODO: load players from roomId: ', roomId)
    // })

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
        const clientId = socket.data.clientId
        console.log(socketClientManager.getAllClients())
        if (socketClientManager.hasClient(clientId)) {
            const userId = clientId
            const player = await userService.findUserById(userId) // TODO
            if (!player) {
                return next(new Error('로비 입장 필요'))
            }

            if (player.roomId) {
                console.log('reconnect')
                socket.join(player.roomId)
            }
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
