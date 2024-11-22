import { Socket } from 'socket.io'

export type SocketClientId = string
export type SocketRoomId = string

class SocketClientManager {
    private clients: Map<SocketClientId, Socket['id']>
    private static instance: SocketClientManager

    private constructor() {
        this.clients = new Map<SocketClientId, Socket['id']>()
    }

    public static getInstance(): SocketClientManager {
        if (!this.instance) {
            this.instance = new SocketClientManager()
        }
        return this.instance
    }

    hasClient(clientId: SocketClientId): boolean {
        return Boolean(this.getSocketId(clientId))
    }

    addOrUpdateClient(clientId: SocketClientId, socketId: Socket['id']): void {
        this.clients.set(clientId, socketId)
    }

    removeClient(clientId: SocketClientId): void {
        this.clients.delete(clientId)
    }

    getSocketId(clientId: SocketClientId): Socket['id'] | undefined {
        return this.clients.get(clientId)
    }

    getAllClients(): Map<SocketClientId, Socket['id']> {
        return this.clients
    }
}

const socketClientManager = SocketClientManager.getInstance()

export default socketClientManager
