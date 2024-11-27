// santa.ts
import { Character, Position } from './player'
import { CharacterType } from '../maps/common'
import { updateInterval } from '../maps/common'

export class SantaCharacter extends Character {
    private skillCooldownTime: number = 15 * updateInterval // 스킬 쿨다운 시간 (초)
    private skillDurationTime: number = 5 * updateInterval // 스킬 지속 시간 (초)
    private currentSkillCooldown: number = 0 // 현재 남은 쿨다운 시간
    private currentSkillDuration: number = 0 // 현재 남은 스킬 지속 시간
    constructor(params: {
        id: string
        nickName: string
        position: Position
        color: string
    }) {
        super({ ...params, charType: CharacterType.SANTA })
    }

    getMaxSpeed(): number {
        return this.isSkillActive ? 20 : 10 // 스킬 사용 시 속도 증가
    }

    useSkill() {
        if (this.currentSkillCooldown <= 0) {
            this.isSkillActive = true
            this.currentSkillDuration = this.skillDurationTime
            this.currentSkillCooldown = this.skillCooldownTime
        } else {
            // Todo: 이런 메세지를 FE에서 보여줄수있으면 좋은데
            // 어차피 쿨다운 시간자체를 FE에 보내고있으니깐 알아서 핸들링 해도될거같기도하고
            // console.log('스킬이 아직 쿨다운 중입니다.')
        }
    }

    update() {
        super.update()
        if (this.isSkillActive) {
            this.currentSkillDuration -= 1
            if (this.currentSkillDuration <= 0) {
                this.isSkillActive = false
                this.currentSkillDuration = 0
            }
        }

        if (this.currentSkillCooldown > 0) {
            this.currentSkillCooldown -= 1
        }

        if (this.isSkillInput) {
            this.useSkill()
            this.isSkillInput = false
        }
    }
    getClientData() {
        return {
            ...super.getClientData(),
            currentSkillCooldown: this.currentSkillCooldown,
        }
    }
}
