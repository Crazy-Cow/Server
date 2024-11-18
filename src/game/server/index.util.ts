import { OnEventData } from '../../socket/types/on'
import { Character } from '../../game/objects/player'

const handleMove = (character: Character, data: OnEventData['move']) => {
    character.shift = data.shift
    character.position = data.character.position
    character.velocity = data.character.velocity
    character.isOnGround = data.character.isOnGround
}

export default {
    handleMove,
}
