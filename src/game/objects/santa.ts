// santa.ts
import { Character, Position } from './player'
import { CharacterType } from '../maps/common'

export class SantaCharacter extends Character {
    constructor(params: {
        id: string
        nickName: string
        position: Position
        color: string
    }) {
        super({ ...params, charType: CharacterType.SANTA })
    }
    getMaxSpeed(): number {
        return this.skill ? 20 : 10 // 스킬 사용 시 속도 증가
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
