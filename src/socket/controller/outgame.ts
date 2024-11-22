import { Socket } from 'socket.io'
import { BaseController } from './base'
import { OnEventName } from '../types/on'
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
        // this.getSocket().on<OnEventName>('room.leave', this.handleRoomLeave)
    }

    // disconnect() {
    //     const userId = this.getUserId()
    //     const room = roomService.leaveRoom(userId)
    //     userService.removeUser(userId)
    //     if (room) {
    //         // user가 존재하던 room
    //         this.broadcastRoomState(room)
    //     }
    // }

    private broadcastRoomState = (room: Room) => {
        const data = getRoomStateDto(room)
        this.broadcast(room.roomId, 'room.changeState', data)
    }

    private handleRoomEnter = async (): Promise<Room> => {
        const userId = this.getUserId()
        const player = await userService.findUserById(userId)
        const room = roomService.joinRoom(player)
        this.socket.join(room.roomId)
        this.broadcastRoomState(room)

        if (room.state === 'playing') {
            console.log('게임 시작!')

            this.broadcast(room.roomId, 'game.start', { players: room.players })
            await roomService.moveOutgameToIngame()
            this.ingameCtrl.handleStartGame(room)
        }

        return room
    }

    // handleRoomLeave = (args: OnEventData['room.leave']) => {
    //     this.logger('room.leave', args)
    //     const userId = this.socket.id
    //     const room = roomService.leaveRoom(userId)
    //     this.broadcastRoomState(room)
    // }
}

export default OutgameController
