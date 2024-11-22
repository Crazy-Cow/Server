import { CommonMap, TailTagMap } from '../game/maps'
import roomRepository, { RoomRepository } from '../../db/redis/repository/rooms'
import userRepository, { UserRepository } from '../../db/redis/repository/users'
import { Server } from 'socket.io'
import { EmitEventName } from 'ingame/types/emit'

export class GameRoom {
    roomId: string
    gameMap: CommonMap = new TailTagMap({ remainRunningTime: 10 * 60 })

    constructor({ roomId }: { roomId: string }) {
        this.roomId = roomId
    }

    addPlayer = (props: { id: string; nickName: string }) => {
        this.gameMap.addCharacter(props)
    }

    startGame(io: Server) {
        this.gameMap.init()
        this.gameMap.startGameLoop({
            handleGameState: (data) => {
                io.to(this.roomId).emit<EmitEventName>('ingame.state', data)
            },
            handleGameOver: () => {
                console.log('게임 끝!')
                io.to(this.roomId).emit<EmitEventName>('ingame.over')
            },
        })
    }
}

class GameRoomService {
    private roomRepository: RoomRepository
    private userRepository: UserRepository
    private gameRooms: GameRoom[]

    private constructor() {
        this.roomRepository = roomRepository
        this.userRepository = userRepository
        this.gameRooms = []
    }

    private static instance: GameRoomService

    public static getInstance(): GameRoomService {
        if (!this.instance) {
            this.instance = new GameRoomService()
        }
        return this.instance
    }

    async createRoom(roomId: string) {
        const room = new GameRoom({ roomId })
        const playerIds = await this.roomRepository.findById(roomId)
        for (const id of playerIds) {
            const player = await this.userRepository.findById(id)
            room.addPlayer({ id, nickName: player.nickName })
        }

        this.gameRooms.push(room)

        return room
    }

    findById(roomId: string) {
        return this.gameRooms.find((room) => room.roomId === roomId)
    }
}

const gameRoomService = GameRoomService.getInstance()

export default gameRoomService
