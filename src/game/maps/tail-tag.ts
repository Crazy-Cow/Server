import {
    SocketEmitEvtDataGameLogSteal,
    SocketEmitEvtDataGameLogStealCombo,
} from '../../socket/types/emit'
import { Character } from '../objects/player'
import { CommonMap } from './common'
import { StealLogProps } from 'db/redis/respository/log/index.type'
import logRepository from '../../db/redis/respository/log'

const TAIL_STEAL_DISTANCE = 6

export class TailTagMap extends CommonMap {
    private stealQueue: { characterId: string }[] = []
    private logRepository = logRepository

    init() {
        super.init()

        for (let i = 0; i < this.characters.length; i++) {
            this.characters[i].setGiftCnt(1)
        }
    }

    private async handleStealSuccess(
        props: Omit<StealLogProps, 'roomId' | 'timeStamp'>
    ) {
        const actor: Character = this.findCharacter(props.actorId)
        const victim: Character = this.findCharacter(props.victimId)
        const timeStamp = Date.now()

        // console.log('[start] steal', Date.now())
        await this.logRepository // FYI. 비동기
            .handleSteal({ ...props, roomId: this.getRoomId(), timeStamp })
            .then(({ comboMessage }) => {
                if (comboMessage) {
                    const data: SocketEmitEvtDataGameLogStealCombo = {
                        actor: {
                            id: actor.id,
                            nickName: actor.nickName,
                            combo: comboMessage,
                        },
                    }
                    this.broadcast('game.log.steal-combo', data)
                }
            })

        const data: SocketEmitEvtDataGameLogSteal = {
            actor: { id: props.actorId, nickName: actor.nickName },
            victim: { id: props.victimId, nickName: victim.nickName },
        }
        // console.log('[end] steal', Date.now())
        this.broadcast('game.log.steal', data)
    }

    addStealQueue(characterId: string) {
        this.stealQueue.push({ characterId })
    }

    async handleCatch(character: Character) {
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

            await this.handleStealSuccess({
                actorId: character.id,
                victimId: closestCharacter.id,
            })
        }
    }

    async updateGameState() {
        super.updateGameState()

        while (this.stealQueue.length > 0) {
            const stealEvent = this.stealQueue.shift()
            const character = this.findCharacter(stealEvent.characterId)
            if (character) {
                await this.handleCatch(character)
            }
        }
    }
}
