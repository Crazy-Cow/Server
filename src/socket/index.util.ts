import { Room } from '../service/rooms'
import { EmitEventData } from './types/emit'
import { OnEventData } from './types/on'
import { Character } from '../game/objects/player'

const handleMove = (character: Character, data: OnEventData['move']) => {
    character.shift = data.shift
    character.position = data.character.position
    character.velocity = data.character.velocity
    character.isOnGround = data.character.isOnGround
}

const getRoomStateDto = (room: Room): EmitEventData['room.changeState'] => {
    return {
        roomId: room.roomId,
        playerCnt: room.players.length,
        state: room.state,
        maxPlayerCnt: room.maxPlayerCnt,
    }
}

export default { handleMove, getRoomStateDto }
