import userService, { User } from './users'
import util from './rooms.util'
import { TailTagMap } from '../game/maps'
import { MapStartLoopType } from 'game/maps/common'

export type RoomState = 'initial' | 'waiting' | 'playing' | 'gameOver'

export class Room {
    roomId: string
    players: User[] = []
    createdAt: Date
    state: RoomState = 'initial'
    maxPlayerCnt: number
    maxWaitingTime: number
    gameMap = new TailTagMap({ remainRunningTime: 10 * 60 })

    constructor({ maxPlayerCnt = 2 }: { maxPlayerCnt?: number }) {
        this.roomId = util.generateRoomId()
        this.createdAt = new Date()
        this.state = 'waiting'

        this.maxPlayerCnt = maxPlayerCnt
    }

    getPlayerCnt = () => {
        return this.players.length
    }

    addPlayer = (player: User) => {
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

    loadGame() {
        for (const user of this.players) {
            this.gameMap.addCharacter({
                id: user.userId,
                nickName: user.nickName,
            })
        }

        this.gameMap.init()
    }

    startGameLoop(props: MapStartLoopType) {
        this.gameMap.startGameLoop(props)
    }
}

class RoomPool {
    gameRooms: Room[] = [] // TODO: migrate gameService
    waitingRoom = new Room({})

    findGameRoomById(roomId: string): Room {
        return this.gameRooms.find((room) => room.roomId == roomId)
    }

    isWaitingRoomFull(): boolean {
        return this.waitingRoom.isFull()
    }

    joinRoom(user: User) {
        const prevWaitingRoom = this.waitingRoom
        this.waitingRoom.addPlayer(user)

        if (this.waitingRoom.canStartGame()) {
            this.waitingRoom.state = 'playing'
            this.gameRooms.push(this.waitingRoom)
            this.waitingRoom = new Room({})
        }

        return prevWaitingRoom
    }

    leaveRoom(userId: string) {
        const player = userService.findUserById(userId)

        if (!player) return

        if (player.roomId === this.waitingRoom.roomId) {
            this.waitingRoom.removePlayer(userId)
            return this.waitingRoom
        }
    }

    deleteGameRoom(room: Room) {
        const gameRoomIndex = this.gameRooms.findIndex(
            (r) => r.roomId === room.roomId
        )

        if (gameRoomIndex > -1) {
            this.gameRooms.splice(gameRoomIndex, 1)
        }
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

    findGameRoomById(roomId: string): Room {
        return this.roomPool.findGameRoomById(roomId)
    }

    joinRoom(player: User): Room {
        return this.roomPool.joinRoom(player)
    }

    leaveRoom(userId: string) {
        return this.roomPool.leaveRoom(userId)
    }

    endGame(room: Room) {
        this.roomPool.deleteGameRoom(room)
    }
}

const roomService = RoomService.getInstance()

export default roomService
