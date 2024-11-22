import { BaseController } from './base'
import { OnEventName } from '../types/on'
import roomService, { Room } from '../../service/rooms'
import userService from '../../service/users'
import { EmitEventData } from '../types/emit'

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
    register() {
        this.socket.on<OnEventName>('room.enter', this.handleRoomEnter)
    }

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

            await roomService.moveOutgameToIngame()
            this.broadcast(room.roomId, 'game.ready', undefined)
            setInterval(() => {
                this.broadcast(room.roomId, 'game.enter', undefined)
            }, 3000)
        }

        return room
    }
}

export default OutgameController
