import { Room } from '../service/rooms'
import { SocketEmitEvtDataType } from './type'

const getRoomStateDto = (
    room: Room
): SocketEmitEvtDataType['room.changeState'] => {
    return {
        roomId: room.roomId,
        playerCnt: room.players.length,
        state: room.state,
        maxPlayerCnt: room.maxPlayerCnt,
    }
}

export default { getRoomStateDto }
