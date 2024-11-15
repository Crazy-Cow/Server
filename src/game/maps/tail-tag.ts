import { Character, Position } from '../objects/player'
import { CommonMap } from './common'

const TAIL_STEAL_DISTANCE = 5

export class TailTagMap extends CommonMap {
    private calculateDistance(pos1: Position, pos2: Position) {
        const dx = pos1.x - pos2.x
        const dz = pos1.z - pos2.z
        return Math.sqrt(dx * dx + dz * dz)
    }

    handleCatch(character: Character) {
        if (character.hasTail) return // 이미 꼬리를 가지고 있다면 훔치지 않음

        for (const other of this.characters) {
            if (
                character.id !== other.id &&
                other.hasTail &&
                !other.isBeingStolen // 다른 캐릭터가 훔쳐지는 중인지 확인
            ) {
                const distance = this.calculateDistance(
                    character.position,
                    other.position
                )

                if (distance <= TAIL_STEAL_DISTANCE) {
                    other.isBeingStolen = true // 다른 캐릭터를 훔쳐지고 있는 상태로 설정

                    // 꼬리를 훔치는 로직
                    character.hasTail = true
                    other.hasTail = false

                    console.log(
                        `${character.id} has stolen the tail from ${other.id}`
                    )

                    // 꼬리 훔치기 후 반복 종료
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
