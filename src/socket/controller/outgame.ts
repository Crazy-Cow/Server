import { Socket } from 'socket.io'
import { BaseController } from './base'
import { OnEventData, OnEventName } from '../types/on'
import roomService, { Room } from '../../service/rooms'
import userService from '../../service/users'
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
        this.getSocket().on<OnEventName>('room.leave', this.handleRoomLeave)
    }

    disconnect() {
        console.log('[disconnect] outgame')

        const userId = this.getUserId()
        const room = roomService.leaveRoom(userId)
        if (room) {
            // user가 존재하던 room
            this.broadcastRoomState(room)
        }
    }

    private broadcastRoomState = (room: Room) => {
        const data = getRoomStateDto(room)
        this.broadcast(room.roomId, 'room.changeState', data)
    }

    private handleRoomEnter = (): Room => {
        this.logger('========== room.join ========== ')
        const userId = this.getUserId()
        const player = userService.findUserById(userId)
        const room = roomService.joinRoom(player)
        this.socket.join(room.roomId)
        this.broadcastRoomState(room)

        if (room.state === 'playing') {
            console.log('게임 시작!')
            this.broadcast(room.roomId, 'game.ready', undefined)
            setTimeout(() => {
                this.broadcast(room.roomId, 'game.start', {
                    players: room.players,
                })
                this.ingameCtrl.handleStartGame(room)
            }, 3000)
        }
        return room
    }

    handleRoomLeave = (args: OnEventData['room.leave']) => {
        this.logger('room.leave', args)
        const userId = this.getUserId()
        const room = roomService.leaveRoom(userId)
        console.log(`[${userId}]room`, room)
        this.broadcastRoomState(room)
    }
}

export default OutgameController
