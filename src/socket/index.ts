import { Server, Socket } from 'socket.io'
import { OnEventData, OnEventName } from './types/on'
import { IngameController, OutgameController } from './controller'
import { verifyToken } from '../utils/jwt'

class SocketImplement {
    socket: Socket

    outgameCtrl: OutgameController
    ingameCtrl: IngameController

    constructor(userId: string, socket: Socket) {
        this.socket = socket
        this.ingameCtrl = new IngameController({ userId, socket })
        this.outgameCtrl = new OutgameController({
            userId,
            socket,
            ingameCtrl: this.ingameCtrl,
        })

        this.register()
    }

    private register = () => {
        this.logger('eventHandlers registered')
        this.socket.on<OnEventName>('disconnect', this.handleDisconnect)
        this.outgameCtrl.register()
        this.ingameCtrl.register()
    }

    private handleDisconnect = (args: OnEventData['disconnect']) => {
        this.logger('disconnect', args)
        this.outgameCtrl.disconnect()
        this.ingameCtrl.disconnect()
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
        const token = socket.handshake.auth.token

        if (token) {
            try {
                const { userId } = verifyToken(token)
                console.log('Token is valid')

                const instance = new SocketImplement(userId, socket)
                instance.logger('complete connection')
            } catch (error) {
                console.error('Invalid token', error)
                socket.disconnect()
            }
        } else {
            console.log('No token found in connection attempt')
            socket.disconnect()
        }
    })
}
