import { Character } from '../../game/objects/player'
import { OnEventData } from '../../socket/type'

const handleMove = (character: Character, data: OnEventData['move']) => {
    character.shift = data.shift
    character.position = data.character.position
    character.velocity = data.character.velocity
    character.isOnGround = data.character.isOnGround
}

export default {
    handleMove,
}
