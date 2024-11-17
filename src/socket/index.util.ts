import { Room } from '../service/rooms'
import { SocketEmitEvtData } from './type'

const getRoomStateDto = (room: Room): SocketEmitEvtData['room.changeState'] => {
    return {
        playerCnt: room.players.length,
        state: room.state,
        maxPlayerCnt: room.maxPlayerCnt,
    }
}

export default { getRoomStateDto }
