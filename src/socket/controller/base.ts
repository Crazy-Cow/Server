import { Socket } from 'socket.io'
import { EmitEventName } from 'socket/types/emit'
import { OnEventData } from 'socket/types/on'

export abstract class BaseController {
    socket: Socket
    constructor({ socket }: { socket: Socket }) {
        this.socket = socket
    }

    abstract register(): void
    abstract disconnect(): void

    getUserId(): string {
        return this.socket.id
    }

    broadcast(roomId: string, emitMessage: EmitEventName, data: unknown) {
        // self
        this.socket.emit<EmitEventName>(emitMessage, data)

        // the other
        this.socket.to(roomId).emit<EmitEventName>(emitMessage, data)
    }

    logger = (msg: string, args?: OnEventData) => {
        console.log(
            `[${this.socket.id}] ${msg} ${args ? JSON.stringify(args) : ''}`
        )
    }
}
