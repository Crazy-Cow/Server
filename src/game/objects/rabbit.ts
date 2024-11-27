// rabbit.ts
import { Character } from './player'

export class RabbitCharacter extends Character {
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
