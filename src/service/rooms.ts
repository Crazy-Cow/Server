import { User } from './users'
import util from './rooms.util'

type RoomState = 'initial' | 'waiting' | 'playing' | 'gameOver'

// 대기실
class Room {
    roomId: string

    players: User[] = []

    createdAt: Date

    state: RoomState = 'initial'

    maxPlayerCnt = 20

    minPlayerCnt = 10

    maxWaitingTime = 30

    constructor() {
        this.roomId = util.generateRoomId()
        this.createdAt = new Date()
        this.state = 'waiting'
    }

    getPlayerCnt = () => {
        return this.players.length
    }

    addPlayer = (player: User) => {
        this.players.push(player)
    }

    removePlayer = (userId: string) => {
        this.players = this.players.filter((user) => user.userId !== userId)
    }

    canStartGame = (): boolean => {
        const currentTime = new Date()
        const waitingTime =
            (currentTime.getTime() - this.createdAt.getTime()) / 1000 // time in seconds

        const cond1 = this.isFull()
        const cond2 =
            this.getPlayerCnt() >= this.minPlayerCnt &&
            waitingTime >= this.maxWaitingTime

        if (cond1 || cond2) {
            return true
        }
        return false
    }

    isFull = (): boolean => {
        return this.getPlayerCnt() >= this.maxPlayerCnt
    }
}

class RoomPool {
    // gameRooms: Room[] = []
    waitingRoom = new Room()

    isWaitingRoomFull(): boolean {
        return this.waitingRoom.isFull()
    }

    joinRoom(user: User) {
        this.waitingRoom.addPlayer(user)

        if (this.isWaitingRoomFull()) {
            this.waitingRoom.state = 'playing'
            // this.gameRooms.push(this.waitingRoom) // TODO: call gameService
            this.waitingRoom = new Room()
        }
    }

    leaveRoom(userId: string) {
        this.waitingRoom.removePlayer(userId)
    }
}

class RoomService {
    private roomPool: RoomPool

    private constructor() {
        this.roomPool = new RoomPool()
    }

    private static instance: RoomService

    public static getInstance(): RoomService {
        if (!this.instance) {
            this.instance = new RoomService()
        }
        return this.instance
    }

    joinRoom(player: User) {
        this.roomPool.joinRoom(player)
    }

    leaveRoom(userId: string) {
        this.roomPool.leaveRoom(userId)
    }
}

const roomService = RoomService.getInstance()

export default roomService
