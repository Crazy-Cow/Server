import { Server, Socket } from 'socket.io'
import { OnEventData, OnEventName } from './types/on'
import { IngameController, OutgameController } from './controller'

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
        const instance = new SocketImplement(socket)
        instance.logger('complete connection')
    })
}
