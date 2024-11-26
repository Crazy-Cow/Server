import { Character } from '../objects/player'
import { CommonMap } from './common'

const TAIL_STEAL_DISTANCE = 8

export class TailTagMap extends CommonMap {
    init() {
        super.init()

        for (let i = 0; i < this.characters.length; i++) {
            this.characters[i].setGiftCnt(1)
        }
    }

    handleCatch(character: Character) {
        for (const other of this.characters) {
            if (
                character.id !== other.id &&
                other.giftCnt >= 1 &&
                !other.isBeingStolen // 다른 캐릭터가 훔쳐지는 중인지 확인
            ) {
                const distance = super.calculateDistance(
                    character.position,
                    other.position
                )

                if (distance <= TAIL_STEAL_DISTANCE) {
                    other.isBeingStolen = true // 다른 캐릭터를 훔쳐지고 있는 상태로 설정
                    character.isSteal = true
                    // 선물를 훔치는 로직
                    character.giftCnt += 1
                    other.giftCnt -= 1
                    // 선물 훔치기 후 반복 종료
                    break
                }
            }
        }
    }

    updateGameState(): void {
        super.updateGameState()

        this.characters.forEach((character) => {
            character.isBeingStolen = false
            character.isSteal = false

            if (character.steal) this.handleCatch(character)
        })
    }
}
