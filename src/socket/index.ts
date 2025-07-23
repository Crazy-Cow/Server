import { Server, Socket } from 'socket.io'
import { /*OnEventData,*/ OnEventName } from './types/on'
import { IngameController, OutgameController } from './controller'
import { verifyToken } from '../utils/jwt'
import roomService, { Player } from '../service/rooms'
import util from '../service/users.util'
import pendingSessionService from '../service/pending-sessions'

type SocketAccessToken = string

let globalIO: Server | null = null

class SocketImplement {
    socket: Socket
    outgameCtrl: OutgameController
    ingameCtrl: IngameController

    constructor(socket: Socket) {
        this.socket = socket
        this.ingameCtrl = new IngameController({ socket })
        this.outgameCtrl = new OutgameController({
            socket,
            ingameCtrl: this.ingameCtrl,
        })
        this.register()
    }

    private register = () => {
        this.socket.on<OnEventName>('disconnect', this.handleDisconnect)
        this.outgameCtrl.register()
        this.ingameCtrl.register()
    }

    private handleDisconnect = (/*reason: OnEventData['disconnect']*/) => {
        // console.log(`[${this.socket.id}] disconnect (${reason})`)
        this.outgameCtrl.disconnect()
        this.ingameCtrl.disconnect()
    }

    public logger = (/*msg: string, args?: OnEventData*/) => {
        // console.log(
        //     `[${this.socket.id}] ${msg} ${args ? JSON.stringify(args) : ''}`
        // )
    }

    // 대기 중인 게임에 자동 참여
    public handleAutoJoinGame = (gameSessionId: string, charType?: number) => {
        // 이미 시작된 게임 찾기
        const startedGame =
            roomService.findStartedGameByGameSessionId(gameSessionId)
        if (startedGame) {
            console.log(
                `자동으로 이미 시작된 게임에 참여: gameSessionId=${gameSessionId}`
            )

            // 클라이언트를 게임방에 join
            this.socket.join(startedGame.roomId)
            this.outgameCtrl.updateRoomId(startedGame.roomId)
            this.ingameCtrl.updateRoomId(startedGame.roomId)

            // 이미 시작된 게임에 플레이어 추가
            this.ingameCtrl.joinStartedGame(gameSessionId, charType)

            // game.join 이벤트 emit
            this.socket.emit('game.join', {
                roomId: startedGame.roomId,
                gameSessionId: gameSessionId,
            })

            // 현재 게임 상태도 함께 전송
            if (startedGame.gameMap) {
                const gameState = startedGame.gameMap.convertGameState()
                this.socket.emit('game.state', gameState)
            }
        } else {
            console.log(
                `자동 참여할 게임을 찾을 수 없음: gameSessionId=${gameSessionId}`
            )
        }
    }
}

// 전역 io 접근을 위한 함수 추가
export function initSocket(io: Server) {
    globalIO = io // 전달받은 io를 전역 변수에 할당

    io.use((socket, next) => {
        socket.data.clientId = socket.handshake.auth.clientId
        socket.data.nickName = socket.handshake.auth.clientId
        socket.data.isGuest = true
        socket.data.roomId = undefined

        const accessToken: SocketAccessToken = socket.handshake.auth.accessToken
        if (accessToken) {
            const { userId, nickName, isGuest } = verifyToken(accessToken)
            socket.data.clientId = userId
            socket.data.nickName = nickName
            socket.data.isGuest = isGuest
        } else {
            // accessToken이 없으면 임의의 닉네임 생성
            if (!socket.data.clientId) {
                const randomNickname = util.generateGuestNickName()
                socket.data.clientId = randomNickname
                socket.data.nickName = randomNickname
                socket.data.isGuest = true
            }
        }

        // sessionId로 대기 중인 세션이 있는지 확인
        const pendingSession = pendingSessionService.getPendingSession(
            socket.data.clientId
        )
        if (pendingSession) {
            console.log(
                `대기 중인 세션 발견: clientId=${socket.data.clientId}, gameSessionId=${pendingSession.gameSessionId}`
            )
            socket.data.pendingGameSessionId = pendingSession.gameSessionId
            socket.data.pendingRoomId = pendingSession.roomId

            // Challengermode 게임의 경우 sessionId를 clientId로 사용하되,
            // 플레이어 정보는 임시로 생성 (room.launchGame에서 accountId로 교체됨)
            if (socket.data.clientId === pendingSession.gameSessionId) {
                const newUserId = `Guest_${socket.data.clientId.slice(-4)}` // 고정된 userId 생성
                const newNickName = `Guest_${socket.data.clientId.slice(-4)}` // 고정된 nickName 생성

                socket.data.clientId = newUserId
                socket.data.nickName = newNickName
                socket.data.isGuest = true

                console.log(
                    `✅ Challengermode 임시 플레이어 정보 생성: userId=${newUserId}, nickName=${newNickName}`
                )
            }
        }

        if (!socket.data.clientId) {
            return next(new Error('[clientId] required'))
        }
        next()
    })

    io.use(async (socket, next) => {
        const userId = socket.data.clientId
        const roomId = await roomService.getGameRoomIdByUserId(userId)
        if (roomId) {
            // console.log('게임중 - reconnect')
            socket.join(roomId)
            socket.data.roomId = roomId
        }
        next()
    })

    io.use(async (socket, next) => {
        // Challengermode 게임에서 임시 플레이어를 실제 플레이어로 교체
        const userId = socket.data.clientId

        // 대기실에서 해당 userId를 가진 임시 플레이어 찾기
        const waitingRoom = roomService.roomPool.waitingRoom
        const tempPlayerIndex = waitingRoom.players.findIndex(
            (p) => p.userId === userId
        )

        if (tempPlayerIndex !== -1) {
            console.log(
                `임시 플레이어를 실제 플레이어로 교체: userId=${userId}`
            )

            // 임시 플레이어 정보 저장
            const tempPlayer = waitingRoom.players[tempPlayerIndex]
            const accountId = tempPlayer.accountId
            const teamNumber = tempPlayer.teamNumber
            const charType = tempPlayer.charType

            // 임시 플레이어 제거
            waitingRoom.players.splice(tempPlayerIndex, 1)

            // 실제 플레이어로 교체
            const realPlayer = new Player({
                userId: userId,
                nickName: socket.data.nickName,
                isGuest: socket.data.isGuest,
                teamNumber: teamNumber,
                accountId: accountId,
            })

            if (charType) {
                realPlayer.updateCharType(charType)
            }

            waitingRoom.addPlayer(realPlayer)
            console.log(
                `✅ 임시 플레이어 교체 완료: userId=${userId}, accountId=${accountId}`
            )
        }

        // 이미 시작된 게임에서 해당 userId를 가진 플레이어 찾기
        const startedGames = roomService.roomPool.gameRooms
        for (const gameRoom of startedGames) {
            const existingPlayerIndex = gameRoom.players.findIndex(
                (p) => p.userId === userId
            )
            if (existingPlayerIndex !== -1) {
                console.log(
                    `이미 시작된 게임에서 플레이어 발견: userId=${userId}, roomId=${gameRoom.roomId}`
                )

                // 플레이어 정보 업데이트
                const existingPlayer = gameRoom.players[existingPlayerIndex]
                existingPlayer.nickName = socket.data.nickName
                existingPlayer.isGuest = socket.data.isGuest

                // 소켓을 해당 게임방에 join
                socket.join(gameRoom.roomId)
                socket.data.roomId = gameRoom.roomId

                console.log(
                    `✅ 이미 시작된 게임의 플레이어 정보 업데이트: userId=${userId}, roomId=${gameRoom.roomId}`
                )
                break
            }
        }

        next()
    })

    io.on<OnEventName>('connection', (socket: Socket) => {
        new SocketImplement(socket)

        // 대기 중인 세션이 있으면 pendingGameSessionId만 설정 (자동 참여하지 않음)
        if (socket.data.pendingGameSessionId) {
            console.log(
                `대기 중인 세션 발견: gameSessionId=${socket.data.pendingGameSessionId} (자동 참여 대기)`
            )
            // 자동 참여하지 않고 클라이언트가 room.launchGame을 보낼 때까지 대기
        }

        // instance.logger('complete connection')
    })
}

export function getIO(): Server {
    if (!globalIO) {
        throw new Error('IO not initialized')
    }
    return globalIO
}
