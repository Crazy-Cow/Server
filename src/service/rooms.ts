import { User } from './users'
import util from './rooms.util'

export type RoomState = 'initial' | 'waiting' | 'playing' | 'gameOver'

// 그룹 (대기실 | 게임중)
export class Room {
    roomId: string
    players: User[] = []
    createdAt: Date
    state: RoomState = 'initial'
    maxPlayerCnt: number
    minPlayerCnt: number
    maxWaitingTime: number

    constructor({
        maxPlayerCnt = 20,
        minPlayerCnt = 10,
        maxWaitingTime = 30,
    }: {
        maxPlayerCnt?: number
        minPlayerCnt?: number
        maxWaitingTime?: number
    }) {
        this.roomId = util.generateRoomId()
        this.createdAt = new Date()
        this.state = 'waiting'

        this.maxPlayerCnt = maxPlayerCnt
        this.minPlayerCnt = minPlayerCnt
        this.maxWaitingTime = maxWaitingTime
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
    gameRooms: Room[] = [] // TODO: migrate gameService
    waitingRoom = new Room({})

    isWaitingRoomFull(): boolean {
        return this.waitingRoom.isFull()
    }

    joinRoom(user: User) {
        const roomUserIn = this.waitingRoom
        this.waitingRoom.addPlayer(user)

        if (this.waitingRoom.canStartGame()) {
            this.waitingRoom.state = 'playing'
            this.gameRooms.push(this.waitingRoom)
            this.waitingRoom = new Room({})
        }

        return roomUserIn
    }

    leaveRoom(userId: string) {
        this.waitingRoom.removePlayer(userId)
        return this.waitingRoom
    }
}

class RoomService {
    roomPool: RoomPool

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

    joinRoom(player: User): Room {
        return this.roomPool.joinRoom(player)
    }

    leaveRoom(userId: string) {
        return this.roomPool.leaveRoom(userId)
    }
}

const roomService = RoomService.getInstance()

export default roomService
