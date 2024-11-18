import { BaseController, BaseCtrlInitProps } from './base'
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

interface OutgameCtrlInitProps extends BaseCtrlInitProps {
    ingameCtrl: IngameController
}

// 로비 ~ 대기실
class OutgameController extends BaseController {
    ingameCtrl: IngameController

    constructor(props: OutgameCtrlInitProps) {
        super(props)
        this.ingameCtrl = props.ingameCtrl
    }

    register() {
        this.socket.on<OnEventName>('room.enter', this.handleRoomEnter)
        this.socket.on<OnEventName>('room.leave', this.handleRoomLeave)
    }

    disconnect() {
        const userId = this.getUserId()
        const room = roomService.leaveRoom(userId)
        userService.removeUser(userId)

        if (room) {
            // user가 존재하던 room
            this.broadcastRoomState(room)
        }
    }

    private broadcastRoomState = (room: Room) => {
        const data = getRoomStateDto(room)
        this.broadcast(room.roomId, 'room.changeState', data)
    }

    private handleRoomEnter = (args: OnEventData['room.enter']): Room => {
        this.logger('room.enter', args)
        const userId = this.getUserId()
        const player = userService.findUserById(userId)
        const room = roomService.joinRoom(player)
        this.socket.join(room.roomId)
        this.broadcastRoomState(room)

        if (room.state === 'playing') {
            this.ingameCtrl.handleStartGame(room)
        }

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
