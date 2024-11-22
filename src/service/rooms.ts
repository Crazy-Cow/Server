import userService, { User } from './users'
import util from './rooms.util'
import { CommonMap, TailTagMap } from '../game/maps'
import { MapStartLoopType } from 'game/maps/common'
import roomRepository, { RoomRepository } from '../db/redis/repository/rooms'
import { redisClient } from '../db/redis'

export type RoomState = 'initial' | 'waiting' | 'playing' | 'gameOver'

export class Room {
    roomId: string
    players: User[] = []
    createdAt: Date
    state: RoomState = 'initial'
    maxPlayerCnt: number
    maxWaitingTime: number
    gameMap: CommonMap = new TailTagMap({ remainRunningTime: 10 * 60 })

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
        this.gameMap.startGameLoop({
            ...props,
            handleGameOver: () => {
                this.state = 'gameOver'
                props.handleGameOver()
            },
        })
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

    async findGameRoomById(roomId: string) {
        return this.repository.findById(roomId)
    }

    joinRoom(user: User) {
        this.waitingRoom.addPlayer(user)

        if (this.waitingRoom.canStartGame()) {
            this.waitingRoom.state = 'playing'
        }

        return this.waitingRoom
    }

    async moveOutgameToIngame() {
        const room = this.waitingRoom
        await this.repository.createAndSave(room)
        await redisClient.publish('game.start', room.roomId)
        this.waitingRoom = new Room({})
    }

    async leaveRoom(userId: string) {
        const player = await userService.findUserById(userId)

        if (!player) return

        if (player.roomId === this.waitingRoom.roomId) {
            this.waitingRoom.removePlayer(userId)
            return this.waitingRoom
        }

        // TODO: ingame player leave
        // else {
        //     for (const room of this.gameRooms) {
        //         if (room.roomId === player.roomId) {
        //             room.removePlayer(userId)
        //             return room
        //         }
        //     }
        // }
    }
}

const roomService = RoomService.getInstance()

export default roomService
