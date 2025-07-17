import util from './rooms.util'
import gameRoomRepository from '../db/redis/respository/game-room'
import { TailTagMap } from '../game/maps'
import { CharacterType, MapStartLoopType } from '../game/maps/common'
import { getIO } from '../socket'
import challengermodeService from './challengermode'
import gameSummaryService from './game-summary'
import userService from './users'
type PlayerProps = {
    userId: string
    nickName: string
    isGuest: boolean
    teamNumber?: number
    accountId?: string // Optional field for Challengermode account ID
}

export class Player {
    userId: string
    nickName: string
    isGuest: boolean
    charType: CharacterType
    teamNumber?: number
    accountId?: string // Optional field for Challengermode account ID

    constructor({
        userId,
        nickName,
        isGuest,
        teamNumber,
        accountId,
    }: PlayerProps) {
        this.userId = userId
        this.nickName = nickName
        this.isGuest = isGuest
        this.teamNumber = teamNumber
        this.accountId = accountId
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
    waitingTimeLimit = 15 * 1000
    gameSessionId: string | null = null
    dateStarted: string | null = null
    isChallengermodeGame: boolean = false

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

    // Challengermode API 호출 메서드들
    async reportToChallengermode(
        state: 'creating' | 'created' | 'starting' | 'started' | 'finished'
    ) {
        if (!this.gameSessionId) {
            // 게임 세션 ID가 없으면 생성
            this.gameSessionId = util.generateRoomId()
            challengermodeService.setGameSessionId(this.gameSessionId)
        } else {
            // 이미 있는 경우 Challengermode 서비스에도 설정
            challengermodeService.setGameSessionId(this.gameSessionId)
        }

        const competitors = await Promise.all(
            this.players.map(async (player) => {
                let accountId = player.accountId

                // accountId가 없으면 유저의 challengermodeId를 찾아서 사용
                if (!accountId) {
                    try {
                        // nickName으로 유저를 찾아서 challengermodeId를 가져옴
                        const user = await userService.getUserByNickName(
                            player.nickName
                        )
                        if (user && user.challengermodeId) {
                            accountId = user.challengermodeId
                            console.log(
                                `유저 ${player.nickName}의 challengermodeId: ${accountId}`
                            )
                        }
                    } catch (error) {
                        console.warn(
                            `유저 ${player.nickName}의 challengermodeId를 찾을 수 없습니다:`,
                            error
                        )
                    }
                }

                return {
                    gameAccountReference: {
                        accountId: accountId || player.userId, // challengermodeId가 있으면 사용, 없으면 userId 사용
                    },
                    teamNumber: player.teamNumber,
                }
            })
        )

        switch (state) {
            case 'creating':
                await challengermodeService.reportCreating(
                    this.roomId,
                    competitors
                )
                break
            case 'created':
                await challengermodeService.reportCreated(
                    this.roomId,
                    competitors
                )
                break
            case 'starting':
                await challengermodeService.reportStarting(
                    this.roomId,
                    competitors
                )
                break
            case 'started':
                if (!this.dateStarted) {
                    this.dateStarted = new Date().toISOString()
                }
                await challengermodeService.reportStarted(
                    this.roomId,
                    competitors,
                    this.dateStarted
                )
                break
            case 'finished': {
                console.log('Challengermode finished API 호출')
                const dateEnded = new Date().toISOString()
                // 게임 결과 생성
                const gameResult =
                    await gameSummaryService.getChallengermodeGameResult(
                        this.roomId
                    )

                await challengermodeService.reportFinished(
                    this.roomId,
                    competitors,
                    this.dateStarted || new Date().toISOString(),
                    dateEnded,
                    gameResult
                )
                break
            }
        }
    }
}

class RoomPool {
    gameRooms: Room[] = [] // TODO: migrate gameService
    waitingRoom = new Room({})

    findGameRoomById(roomId: string): Room {
        return this.gameRooms.find((room) => room.roomId == roomId)
    }

    findWaitingRoomByGameSessionId(gameSessionId: string): Room | null {
        // 1. 정확한 gameSessionId 매칭
        if (this.waitingRoom.gameSessionId === gameSessionId) {
            return this.waitingRoom
        }

        // 2. gameSessionId가 없지만 플레이어들이 있는 대기실 (KEM 게임으로 전환 가능)
        if (
            !this.waitingRoom.gameSessionId &&
            this.waitingRoom.players.length > 0
        ) {
            return this.waitingRoom
        }

        return null
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

    findWaitingRoomByGameSessionId(gameSessionId: string): Room | null {
        return this.roomPool.findWaitingRoomByGameSessionId(gameSessionId)
    }

    // gameSessionId로 이미 시작된 게임을 찾는 메서드
    findStartedGameByGameSessionId(gameSessionId: string): Room | null {
        for (const gameRoom of this.roomPool.gameRooms) {
            if (gameRoom.gameSessionId === gameSessionId) {
                return gameRoom
            }
        }
        return null
    }

    // gameSessionId로 대기실을 찾거나 생성하는 메서드
    async joinRoomByGameSessionId(
        player: Player,
        gameSessionId: string
    ): Promise<Room> {
        // 1. 기존 대기실에서 해당 gameSessionId를 가진 방 찾기
        let waitingRoom =
            this.roomPool.findWaitingRoomByGameSessionId(gameSessionId)

        if (!waitingRoom) {
            // 2. 기존 대기실에 플레이어들이 있는지 확인
            const existingWaitingRoom = this.roomPool.waitingRoom
            if (existingWaitingRoom.players.length > 0) {
                // 기존 대기실에 플레이어들이 있으면 그 대기실 사용
                waitingRoom = existingWaitingRoom
                waitingRoom.gameSessionId = gameSessionId
                waitingRoom.isChallengermodeGame = true // KEM 게임으로 설정
                console.log(
                    `기존 대기실을 KEM 게임으로 설정: gameSessionId=${gameSessionId}, 기존 플레이어 수=${waitingRoom.players.length}`
                )
            } else {
                // 3. 없으면 새로운 대기실 생성
                waitingRoom = new Room({})
                waitingRoom.gameSessionId = gameSessionId
                waitingRoom.isChallengermodeGame = true // KEM 게임으로 설정
                this.roomPool.waitingRoom = waitingRoom
                console.log(
                    `새로운 KEM 대기실 생성: gameSessionId=${gameSessionId}`
                )
            }
        }

        // 4. 중복 입장 방지: 이미 해당 대기실에 있는 플레이어인지 확인
        const existingPlayer = waitingRoom.players.find(
            (p) => p.userId === player.userId
        )
        if (existingPlayer) {
            console.log(
                `플레이어 ${player.nickName}이 이미 KEM 대기실에 있음: gameSessionId=${gameSessionId}`
            )
            return waitingRoom
        }

        // 5. 플레이어를 대기실에 추가
        waitingRoom.addPlayer(player)
        console.log(
            `플레이어 ${player.nickName}이 KEM 대기실에 입장: gameSessionId=${gameSessionId}`
        )

        // 6. 첫 번째 플레이어가 입장할 때 Creating 상태 보고
        if (waitingRoom.getPlayerCnt() === 1) {
            await waitingRoom.reportToChallengermode('creating')
        }

        return waitingRoom
    }

    // 기존 joinRoom에서 정원이 꽉 차면 OutgameController가 아닌 자신이 직접 startGame 호출
    async joinRoom(player: Player): Promise<Room> {
        const prevWaitingRoom = this.roomPool.waitingRoom
        this.roomPool.waitingRoom.addPlayer(player)

        // 첫 번째 플레이어가 입장할 때 Creating 상태 보고 (KEM 게임인 경우에만)
        if (
            this.roomPool.waitingRoom.getPlayerCnt() === 1 &&
            this.roomPool.waitingRoom.isChallengermodeGame
        ) {
            await this.roomPool.waitingRoom.reportToChallengermode('creating')
        }

        // 일반 게임: 정원이 찰 때 자동 시작
        if (!this.roomPool.waitingRoom.isChallengermodeGame) {
            if (this.roomPool.waitingRoom.canStartGame()) {
                // 정원 찼을 때 즉각 시작
                await this.startGame(this.roomPool.waitingRoom)
            } else {
                // 정원이 꽉 차지 않았다면 타이머 설정
                const waitingRoom = this.roomPool.waitingRoom
                if (!waitingRoom.waitingTimeout) {
                    waitingRoom.waitingTimeout = setTimeout(async () => {
                        if (waitingRoom.state === 'waiting') {
                            const playerCount = waitingRoom.getPlayerCnt()
                            if (playerCount >= 2) {
                                // 2명 이상이면 강제 시작
                                await this.startGame(waitingRoom)
                            }
                        }
                        waitingRoom.waitingTimeout = null
                    }, waitingRoom.waitingTimeLimit)
                }
            }
        } else {
            // KEM 게임: 2명 이상이어도 webhook 대기 (타이머만 설정)
            const waitingRoom = this.roomPool.waitingRoom
            if (!waitingRoom.waitingTimeout) {
                waitingRoom.waitingTimeout = setTimeout(async () => {
                    if (waitingRoom.state === 'waiting') {
                        const playerCount = waitingRoom.getPlayerCnt()
                        if (playerCount >= 2) {
                            // 2명 이상이지만 webhook 대기 (게임 시작 안함)
                            console.log(
                                'KEM 게임: 2명 이상 대기 중, webhook 대기...'
                            )
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

        // 일반 게임인 경우에만 대기실 새로 생성
        if (!room.isChallengermodeGame) {
            this.roomPool.waitingRoom = new Room({})
        }
        // KEM 게임인 경우 대기실 유지 (webhook으로 시작된 게임이므로)

        const io = getIO()

        // Challengermode 게임인 경우에만 상태 보고
        if (room.isChallengermodeGame) {
            // Created 상태 보고 (대기실에서 게임 시작 준비 완료)
            await room.reportToChallengermode('created')

            // Starting 상태 보고 (게임 시작 준비)
            await room.reportToChallengermode('starting')
        }

        // 게임 준비 신호 보내고 로드
        io.to(room.roomId).emit('game.ready')
        await room.loadGame()

        // 3초 후 실제 시작
        setTimeout(async () => {
            // Challengermode 게임인 경우에만 Started 상태 보고
            if (room.isChallengermodeGame) {
                await room.reportToChallengermode('started')
            }

            io.to(room.roomId).emit('game.start', {
                players: room.players,
            })
            room.startGameLoop({
                handleGameState: (data) => {
                    io.to(room.roomId).emit('game.state', data)
                },
                handleGameOver: async (data) => {
                    console.log(
                        `게임 종료 - KEM: ${room.isChallengermodeGame}, Room: ${room.roomId}`
                    )

                    // Challengermode 게임인 경우에만 Finished 상태 보고
                    if (room.isChallengermodeGame) {
                        await room.reportToChallengermode('finished')
                    }
                    io.to(room.roomId).emit('game.over', data)
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
