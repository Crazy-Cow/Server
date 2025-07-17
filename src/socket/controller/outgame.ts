import { Socket } from 'socket.io'
import { BaseController } from './base'
import {
    OnEventData,
    OnEventName,
    SocketOnEvtDataRoomEnter,
    SocketOnEvtDataRoomLaunchGame,
    SocketOnEvtDataRoomConfirm,
} from '../types/on'
import roomService, { Room } from '../../service/rooms'
import { EmitEventData } from '../types/emit'
import IngameController from './ingame'
import pendingSessionService from '../../service/pending-sessions'

function getRoomStateDto(room: Room): EmitEventData['room.changeState'] {
    return {
        roomId: room.roomId,
        playerCnt: room.players.length,
        state: room.state,
        maxPlayerCnt: room.maxPlayerCnt,
    }
}

// 로비 ~ 대기실
class OutgameController extends BaseController {
    ingameCtrl: IngameController

    constructor(props: { socket: Socket; ingameCtrl: IngameController }) {
        super(props)
        this.ingameCtrl = props.ingameCtrl
    }
    register() {
        this.socket.on<OnEventName>('room.enter', this.handleRoomEnter)
        this.socket.on<OnEventName>(
            'room.launchGame',
            this.handleRoomLaunchGame
        )
        this.socket.on<OnEventName>('room.confirm', this.handleRoomConfirm)
        this.getSocket().on<OnEventName>('room.leave', this.handleRoomLeave)
    }

    disconnect() {
        // console.log('[disconnect] outgame')

        const userId = this.getUserId()
        const room = roomService.leaveRoom(userId)
        if (room) {
            this.broadcastRoomState(room)
        }
    }

    private broadcastRoomState = (room: Room) => {
        const data = getRoomStateDto(room)
        this.broadcast(room.roomId, 'room.changeState', data)
    }

    private handleRoomEnter = async ({
        charType,
        isKEM = false,
    }: SocketOnEvtDataRoomEnter) => {
        this.logger('========== room.join ========== ')
        const player = this.getPlayer()
        player.updateCharType(charType)

        // KEM 게임인 경우 대기실을 KEM 게임으로 설정
        if (isKEM) {
            roomService.roomPool.waitingRoom.isChallengermodeGame = true
        }

        const room = await roomService.joinRoom(player)

        this.socket.join(room.roomId)
        this.updateRoomId(room.roomId)
        this.ingameCtrl.updateRoomId(room.roomId)
        this.broadcastRoomState(room)
        return room
    }

    private handleRoomLaunchGame = async ({
        charType,
        gameSessionId,
        challengermodeId,
    }: SocketOnEvtDataRoomLaunchGame) => {
        this.logger('========== room.launchGame ========== ')
        console.log('room.launchGame 이벤트 수신:', {
            charType,
            gameSessionId,
            challengermodeId,
            clientId: this.getUserId(),
            nickName: this.getPlayer().nickName,
        })

        const player = this.getPlayer()
        player.updateCharType(charType)

        // Challengermode 게임이고 challengermodeId가 제공된 경우, 임시 플레이어 정보를 사용
        if (challengermodeId) {
            console.log(
                `🔍 challengermodeId로 임시 플레이어 찾기: ${challengermodeId}`
            )

            // 대기실에서 해당 accountId를 가진 임시 플레이어 찾기
            const waitingRoom = roomService.roomPool.waitingRoom
            const tempPlayerIndex = waitingRoom.players.findIndex(
                (p) => p.accountId === challengermodeId
            )

            if (tempPlayerIndex !== -1) {
                console.log(
                    `✅ 임시 플레이어 발견: challengermodeId=${challengermodeId}`
                )

                // 임시 플레이어 정보 가져오기
                const tempPlayer = waitingRoom.players[tempPlayerIndex]

                // 현재 플레이어 정보를 임시 플레이어 정보로 업데이트
                player.userId = tempPlayer.userId
                player.nickName = tempPlayer.nickName
                player.teamNumber = tempPlayer.teamNumber
                player.accountId = tempPlayer.accountId
                player.updateCharType(charType) // 클라이언트에서 받은 charType으로 설정

                // socket.data도 함께 업데이트 (getUserId()에서 사용)
                this.socket.data.clientId = tempPlayer.userId
                this.socket.data.nickName = tempPlayer.nickName

                console.log(
                    `✅ 임시 플레이어 정보 사용: userId=${player.userId}, nickName=${player.nickName}, teamNumber=${player.teamNumber}`
                )
            } else {
                console.log(
                    `❌ challengermodeId로 임시 플레이어를 찾을 수 없음: ${challengermodeId}`
                )
            }
        }

        // 클라이언트에게 플레이어 정보 응답 (게임 참여는 하지 않음)
        this.socket.emit('room.launchGame.response', {
            userId: player.userId,
            nickName: player.nickName,
            isGuest: player.isGuest,
        })

        console.log(`✅ room.launchGame.response 전송: userId=${player.userId}`)
    }

    private handleRoomConfirm = async ({
        userId,
        charType,
        gameSessionId,
    }: SocketOnEvtDataRoomConfirm) => {
        this.logger('========== room.confirm ========== ')
        console.log('room.confirm 이벤트 수신:', {
            userId,
            charType,
            gameSessionId,
            clientId: this.getUserId(),
            nickName: this.getPlayer().nickName,
        })

        // userId가 일치하는지 확인
        console.log(
            `🔍 room.confirm 시작 시 socket.data: clientId=${this.socket.data.clientId}, nickName=${this.socket.data.nickName}`
        )
        console.log(
            `🔍 room.confirm userId 검증: 받은 userId=${userId}, 실제 userId=${this.getUserId()}`
        )
        if (userId !== this.getUserId()) {
            console.error(
                `userId 불일치: 받은 userId=${userId}, 실제 userId=${this.getUserId()}`
            )
            return
        }

        // 대기 중인 세션이 있으면 제거
        if (this.socket.data.pendingGameSessionId) {
            console.log(
                `대기 세션 제거: sessionId=${this.socket.data.pendingGameSessionId}`
            )
            pendingSessionService.removePendingSession(
                this.socket.data.clientId
            )
        }

        // 1. 이미 시작된 게임이 있는지 확인
        const startedGame =
            roomService.findStartedGameByGameSessionId(gameSessionId)
        if (startedGame) {
            console.log(
                `이미 시작된 게임 발견: gameSessionId=${gameSessionId}, roomId=${startedGame.roomId}`
            )

            // 클라이언트를 게임방에 join
            this.socket.join(startedGame.roomId)
            this.updateRoomId(startedGame.roomId)
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

            return startedGame
        }

        // 2. 대기실에서 해당 gameSessionId를 찾거나 생성
        const player = this.getPlayer()
        player.updateCharType(charType)

        const room = await roomService.joinRoomByGameSessionId(
            player,
            gameSessionId
        )

        this.socket.join(room.roomId)
        this.updateRoomId(room.roomId)
        this.ingameCtrl.updateRoomId(room.roomId)
        this.broadcastRoomState(room)
        return room
    }

    handleRoomLeave = (args: OnEventData['room.leave']) => {
        this.logger('room.leave', args)
        const userId = this.getUserId()
        const room = roomService.leaveRoom(userId)
        this.broadcastRoomState(room)
    }
}

export default OutgameController
