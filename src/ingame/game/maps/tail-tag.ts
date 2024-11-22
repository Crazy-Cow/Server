import { Character } from '../objects/player'
import { CommonMap } from './common'

const TAIL_STEAL_DISTANCE = 5
const HAS_TAIL_RATIO = 2

export class TailTagMap extends CommonMap {
    init() {
        super.init()

        for (let i = 0; i < this.characters.length; i++) {
            if (i % HAS_TAIL_RATIO == 0) {
                this.characters[i].setHasTail(true)
            } else {
                this.characters[i].setHasTail(false)
            }
        }
    }

    handleCatch(character: Character) {
        if (character.hasTail) return // 이미 꼬리를 가지고 있다면 훔치지 않음

        for (const other of this.characters) {
            if (
                character.id !== other.id &&
                other.hasTail &&
                !other.isBeingStolen // 다른 캐릭터가 훔쳐지는 중인지 확인
            ) {
                const distance = super.calculateDistance(
                    character.position,
                    other.position
                )

                if (distance <= TAIL_STEAL_DISTANCE) {
                    other.isBeingStolen = true // 다른 캐릭터를 훔쳐지고 있는 상태로 설정

                    // 꼬리를 훔치는 로직
                    character.hasTail = true
                    other.hasTail = false

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

            if (character.shift) this.handleCatch(character)
        })
    }
}
