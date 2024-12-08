import util from './rooms.util'
import gameRoomRepository from '../db/redis/respository/game-room'
import { TailTagMap } from '../game/maps'
import { CharacterType, MapStartLoopType } from '../game/maps/common'

type PlayerProps = {
    userId: string
    nickName: string
    isGuest: boolean
}

export class Player {
    userId: string
    nickName: string
    isGuest: boolean
    charType: CharacterType

    constructor({ userId, nickName, isGuest }: PlayerProps) {
        this.userId = userId
        this.nickName = nickName
        this.isGuest = isGuest
    }

    updateCharType(charType) {
        this.charType = charType
    }
}

export type RoomState = 'initial' | 'waiting' | 'playing' | 'gameOver'

export class Room {
    roomId: string
    players: Player[] = []
    createdAt: Date
    state: RoomState = 'initial'
    maxPlayerCnt: number
    maxWaitingTime: number
    gameMap: TailTagMap

    constructor({ maxPlayerCnt = 10 }: { maxPlayerCnt?: number }) {
        const roomId = util.generateRoomId()
        this.roomId = roomId
        this.createdAt = new Date()
        this.state = 'waiting'
        this.maxPlayerCnt = maxPlayerCnt
        this.gameMap = new TailTagMap({ roomId, remainRunningTime: 2 * 60 })
    }

    getPlayerCnt = () => {
        return this.players.length
    }

    addPlayer = (player: Player) => {
        this.players.push(player)
    }

    removePlayer = (userId: string) => {
        const player = this.players.find((user) => user.userId === userId)

        if (player) {
            this.players = this.players.filter((user) => user.userId !== userId)
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

    async loadGame() {
        for (const player of this.players) {
            this.gameMap.addCharacter({
                id: player.userId,
                nickName: player.nickName,
                charType: player.charType,
            })
            await gameRoomRepository.setGameRoomId(player.userId, this.roomId)
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

    joinRoom(player: Player) {
        const prevWaitingRoom = this.waitingRoom
        this.waitingRoom.addPlayer(player)

        if (this.waitingRoom.canStartGame()) {
            this.waitingRoom.state = 'playing'
            this.gameRooms.push(this.waitingRoom)
            this.waitingRoom = new Room({})
        }

        return prevWaitingRoom
    }

    leaveRoom(userId: string) {
        for (const player of this.waitingRoom.players) {
            if (player.userId === userId) {
                this.waitingRoom.removePlayer(userId)
                return this.waitingRoom
            }
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

    async getGameRoomIdByUserId(userId: string) {
        return gameRoomRepository.getGameRoomId(userId)
    }

    findGameRoomById(roomId: string): Room {
        return this.roomPool.findGameRoomById(roomId)
    }

    joinRoom(player: Player): Room {
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
