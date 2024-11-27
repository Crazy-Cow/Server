// santa.ts
import { Character } from './player'

export class SantaCharacter extends Character {
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
