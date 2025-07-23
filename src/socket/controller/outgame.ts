import { Socket } from 'socket.io'
import { BaseController } from './base'
import {
    OnEventData,
    OnEventName,
    SocketOnEvtDataRoomEnter,
    SocketOnEvtDataRoomLaunchGame,
} from '../types/on'
import roomService, { Room } from '../../service/rooms'
import { EmitEventData } from '../types/emit'
import IngameController from './ingame'

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
        accountId,
    }: SocketOnEvtDataRoomLaunchGame) => {
        this.logger('========== room.launchGame ========== ')
        console.log('room.launchGame 이벤트 수신:', {
            charType,
            gameSessionId,
            accountId,
            clientId: this.getUserId(),
            nickName: this.getPlayer().nickName,
        })

        const player = this.getPlayer()
        player.updateCharType(charType)

        // accountId를 플레이어에 설정 (joinRoomByGameSessionId에서 처리됨)
        if (accountId) {
            player.accountId = accountId
            console.log(
                `🔍 accountId 설정됨: player.accountId=${player.accountId}`
            )
        } else {
            console.log(`❌ accountId가 전달되지 않음`)
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

            // 이미 시작된 게임에 플레이어 추가 (player 객체 전달)
            this.ingameCtrl.joinStartedGame(gameSessionId, charType, player)

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
        const room = await roomService.joinRoomByGameSessionId(
            player,
            gameSessionId
        )

        this.socket.join(room.roomId)
        this.updateRoomId(room.roomId)
        this.ingameCtrl.updateRoomId(room.roomId)
        this.broadcastRoomState(room)

        // 클라이언트에게 플레이어 정보 응답
        this.socket.emit('room.launchGame.response', {
            userId: player.userId,
            nickName: player.nickName,
            isGuest: player.isGuest,
        })

        console.log(`✅ room.launchGame.response 전송: userId=${player.userId}`)
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
