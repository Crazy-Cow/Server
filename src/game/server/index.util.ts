import { Character } from 'game/objects/player'
import { SocketMoveData } from './index.type'

const handleMove = (character: Character, data: SocketMoveData) => {
    character.shift = data.shift
    character.position = data.character.position
    character.velocity = data.character.velocity
    character.isOnGround = data.character.isOnGround
}

export default {
    handleMove,
}
