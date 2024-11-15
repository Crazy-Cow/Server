import { Character, Position } from '../objects/player'
import { CommonMap } from './common'

const TAIL_STEAL_DISTANCE = 5

export class TailTagMap extends CommonMap {
    private calculateDistance(pos1: Position, pos2: Position) {
        const dx = pos1[0] - pos2[0]
        const dz = pos1[2] - pos2[2]
        return Math.sqrt(dx * dx + dz * dz)
    }

    handleCatch(character: Character) {
        if (character.hasTail) return

        for (const other of this.characters) {
            if (
                character.id !== other.id &&
                other.hasTail &&
                !other.isBeingStolen
            ) {
                const distance = this.calculateDistance(
                    character.position,
                    other.position
                )

                if (distance <= TAIL_STEAL_DISTANCE) {
                    other.isBeingStolen = true
                    character.hasTail = true
                    other.hasTail = false
                    break
                }
            }
        }
    }

    updateGameState(): void {
        super.updateGameState()

        this.characters.forEach((character) => {
            character.isBeingStolen = false
            character.updatePosition()

            if (character.shift) this.handleCatch(character)

            // 꼬리가 있을 때 색상 변경
            if (character.hasTail) {
                character.bodyColor = '#888888'
                character.hairColor = '#888888'
                character.bellyColor = '#888888'
            } else {
                character.bodyColor = '#FFFFFF'
                character.hairColor = '#FFFFFF'
                character.bellyColor = '#FFFFFF'
            }
        })
    }
}
