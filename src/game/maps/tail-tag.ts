import { Character } from '../objects/player'
import { CommonMap } from './common'

const TAIL_STEAL_DISTANCE = 6

export class TailTagMap extends CommonMap {
    private stealQueue: { characterId: string }[] = []

    init() {
        super.init()

        for (let i = 0; i < this.characters.length; i++) {
            this.characters[i].setGiftCnt(1)
        }
    }

    addStealQueue(characterId: string) {
        this.stealQueue.push({ characterId })
    }

    handleCatch(character: Character) {
        let closestCharacter: Character = null
        let minDistance = Infinity

        for (const other of this.characters) {
            if (character.id !== other.id && other.giftCnt >= 1) {
                const distance = super.calculateDistance(
                    character.position,
                    other.position
                )

                if (distance <= TAIL_STEAL_DISTANCE ** 2) {
                    if (distance < minDistance) {
                        minDistance = distance
                        closestCharacter = other
                    }
                }
            }
        }

        // 가장 가까운 캐릭터로부터 선물 훔치기
        if (closestCharacter) {
            closestCharacter.isBeingStolen = true
            character.giftCnt += 1
            closestCharacter.giftCnt -= 1
        }
    }

    updateGameState(): void {
        super.updateGameState()

        while (this.stealQueue.length > 0) {
            const stealEvent = this.stealQueue.shift()
            const character = this.findCharacter(stealEvent.characterId)
            if (character) {
                this.handleCatch(character)
            }
        }

        this.characters.forEach((character) => {
            character.isBeingStolen = false
        })
    }
}
