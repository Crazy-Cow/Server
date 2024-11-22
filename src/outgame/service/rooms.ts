import util from './rooms.util'
import roomRepository, { RoomRepository } from '../../db/redis/repository/rooms'
import { RedisGameRoom } from '../../db/redis/models/room'
import redisManager from '../../db/redis/redis-manager'
import { RedisUser } from '../../db/redis/models/user'

export type RoomState = 'initial' | 'waiting' | 'playing' | 'gameOver'

export class Room {
    roomId: string
    players: RedisUser[] = []
    createdAt: Date
    state: RoomState = 'initial'
    maxPlayerCnt: number
    maxWaitingTime: number

    constructor({ maxPlayerCnt = 2 }: { maxPlayerCnt?: number }) {
        this.roomId = util.generateRoomId()
        this.createdAt = new Date()
        this.state = 'waiting'
        this.maxPlayerCnt = maxPlayerCnt
    }

    getPlayerCnt = () => {
        return this.players.length
    }

    addPlayer = (player: RedisUser) => {
        this.players.push(player)
        player.updateRoomId(this.roomId)
    }

    removePlayer = (userId: string) => {
        const player = this.players.find((user) => user.userId === userId)

        if (player) {
            this.players = this.players.filter((user) => user.userId !== userId)
            player.resetRoomId()
        }
    }

    canStartGame = (): boolean => {
        const cond1 = this.isFull()

        if (cond1) {
            return true
        }
        return false
    }

    isFull = (): boolean => {
        return this.getPlayerCnt() >= this.maxPlayerCnt
    }
}

class RoomService {
    repository: RoomRepository
    waitingRoom: Room

    private constructor() {
        this.repository = roomRepository
        this.waitingRoom = new Room({})
    }

    private static instance: RoomService

    public static getInstance(): RoomService {
        if (!this.instance) {
            this.instance = new RoomService()
        }
        return this.instance
    }

    joinRoom(user: RedisUser) {
        this.waitingRoom.addPlayer(user)

        if (this.waitingRoom.canStartGame()) {
            this.waitingRoom.state = 'playing'
        }

        return this.waitingRoom
    }

    leaveRoom(userId: string) {
        return this.waitingRoom.removePlayer(userId)
    }

    async moveOutgameToIngame() {
        const room = this.waitingRoom
        const playerIds = room.players.map((player) => player.userId)
        await this.repository.createAndSave(
            new RedisGameRoom(room.roomId, playerIds)
        )
        await redisManager.common.publish('game.ready', room.roomId)
        this.waitingRoom = new Room({})
    }
}

const roomService = RoomService.getInstance()

export default roomService
