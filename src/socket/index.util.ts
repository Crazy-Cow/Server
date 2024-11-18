import { Room } from '../service/rooms'
import { EmitEventData } from './types/emit'

const getRoomStateDto = (room: Room): EmitEventData['room.changeState'] => {
    return {
        roomId: room.roomId,
        playerCnt: room.players.length,
        state: room.state,
        maxPlayerCnt: room.maxPlayerCnt,
    }
}

export default { getRoomStateDto }
