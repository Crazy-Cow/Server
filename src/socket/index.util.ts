import { Room } from '../service/rooms'
import { SocketEmitEvtData } from './type'

const getRoomStateDto = (room: Room): SocketEmitEvtData['room.changeState'] => {
    return {
        playerCnt: room.players.length,
        state: room.state,
        remainTime: 0, // TODO: 시간 줄이기 필요할까?
    }
}

export default { getRoomStateDto }
