// rabbit.ts
import { Character, Position } from './player'
import { CharacterType } from '../maps/common'

export class RabbitCharacter extends Character {
    constructor(params: {
        id: string
        nickName: string
        position: Position
        color: string
    }) {
        super({ ...params, charType: CharacterType.RABBIT })
    }
    getMaxSpeed(): number {
        return 10 // 기본 속도
    }

    useSkill() {
        if (!this.skill) {
            this.skill = true
            //   this.skillCooltime = 300;
        }
    }

    update() {
        super.update()
        // if(this.skillCooltime > 0){
        // this.skillCooltime -= 1
        // }
    }
}
