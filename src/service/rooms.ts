import util from './rooms.util'
import gameRoomRepository from '../db/redis/respository/game-room'
import { TailTagMap } from '../game/maps'
import { CharacterType, MapStartLoopType } from '../game/maps/common'
import { getIO } from '../socket'
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
    waitingTimeout: NodeJS.Timeout | null = null
    waitingTimeLimit = 5 * 1000

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

    findGameRoomById(roomId: string): Room {
        return this.roomPool.findGameRoomById(roomId)
    }

    // 기존 joinRoom에서 정원이 꽉 차면 OutgameController가 아닌 자신이 직접 startGame 호출
    joinRoom(player: Player): Room {
        const prevWaitingRoom = this.roomPool.waitingRoom
        this.roomPool.waitingRoom.addPlayer(player)

        if (this.roomPool.waitingRoom.canStartGame()) {
            // 정원 찼을 때 즉각 시작
            this.startGame(this.roomPool.waitingRoom)
        } else {
            // 정원이 꽉 차지 않았다면 타이머 설정 (이미 이전 답변에서 제안한 로직)
            const waitingRoom = this.roomPool.waitingRoom
            if (!waitingRoom.waitingTimeout) {
                waitingRoom.waitingTimeout = setTimeout(() => {
                    if (waitingRoom.state === 'waiting') {
                        const playerCount = waitingRoom.getPlayerCnt()
                        if (playerCount >= 2) {
                            // 2명 이상이면 강제 시작
                            this.startGame(waitingRoom)
                        }
                    }
                    waitingRoom.waitingTimeout = null
                }, waitingRoom.waitingTimeLimit)
            }
        }

        return prevWaitingRoom
    }

    async startGame(room: Room) {
        room.state = 'playing'
        this.roomPool.gameRooms.push(room)
        if (room.waitingTimeout) {
            clearTimeout(room.waitingTimeout)
            room.waitingTimeout = null
        }
        this.roomPool.waitingRoom = new Room({})

        const io = getIO()

        // 게임 준비 신호 보내고 로드
        io.to(room.roomId).emit('game.ready')
        await room.loadGame()

        // 3초 후 실제 시작
        setTimeout(() => {
            io.to(room.roomId).emit('game.start', {
                players: room.players,
            })
            // IngameController.handleStartGame(room) 대신 여기서 바로 게임 루프 시작
            room.startGameLoop({
                handleGameState: (data) => {
                    io.to(room.roomId).emit('game.state', data)
                },
                handleGameOver: (data) => {
                    io.to(room.roomId).emit('game.over', data)
                    // 게임 종료 후 정리 로직
                    this.endGame(room)
                },
            })
        }, 3000)
    }

    leaveRoom(userId: string) {
        return this.roomPool.leaveRoom(userId)
    }

    endGame(room: Room) {
        this.roomPool.deleteGameRoom(room)
    }

    async getGameRoomIdByUserId(userId: string) {
        return gameRoomRepository.getGameRoomId(userId)
    }
}

const roomService = RoomService.getInstance()

export default roomService
