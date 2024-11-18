import { Socket } from 'socket.io'
import { EmitEventName } from '../../socket/types/emit'
import { OnEventData } from '../../socket/types/on'
import { User } from '../../service/users'

export interface BaseCtrlInitProps {
    userId: string
    socket: Socket
}

export abstract class BaseController {
    userId: User['userId']
    socket: Socket
    constructor({ userId, socket }: BaseCtrlInitProps) {
        this.userId = userId
        this.socket = socket
    }

    abstract register(): void
    abstract disconnect(): void

    getUserId(): string {
        return this.userId
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
