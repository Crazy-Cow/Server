import { SocketEmitEvtDataGameLogSteal } from 'socket/types/emit'
import eventLogRepository, {
    StealEvent,
} from '../../db/redis/respository/event-log'
import { Character } from '../objects/player'
import { CommonMap } from './common'

const TAIL_STEAL_DISTANCE = 6

export class TailTagMap extends CommonMap {
    private stealQueue: { characterId: string }[] = []
    private eventLogRepository = eventLogRepository

    init() {
        super.init()

        for (let i = 0; i < this.characters.length; i++) {
            this.characters[i].setGiftCnt(1)
        }
    }

    private handleStealSuccess(props: Omit<StealEvent, 'roomId'>) {
        // TODO: 비동기
        this.eventLogRepository.addSteal({ ...props, roomId: this.getRoomId() })

        const actor: Character = this.findCharacter(props.actorId)
        const victim: Character = this.findCharacter(props.victimId)

        const data: SocketEmitEvtDataGameLogSteal = {
            actor: { id: props.actorId, nickName: actor.nickName },
            victim: { id: props.victimId, nickName: victim.nickName },
        }

        this.broadcast('game.log.steal', data)
    }

    addStealQueue(characterId: string) {
        this.stealQueue.push({ characterId })
    }

    handleCatch(character: Character) {
        let closestCharacter: Character = null
        let minDistance = Infinity

        for (const other of this.characters) {
            if (
                character.id !== other.id &&
                other.giftCnt >= 1 &&
                other.protect < 1
            ) {
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
            closestCharacter.stolen = true
            closestCharacter.eventBlock = 2
            closestCharacter.protect = 10
            closestCharacter.giftCnt -= 1
            character.giftCnt += 1
            character.protect = 8

            this.handleStealSuccess({
                actorId: character.id,
                victimId: closestCharacter.id,
            })
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
    }
}
