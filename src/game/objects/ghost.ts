import { Character, Position } from './player'
import { CharacterType } from '../maps/common'
import { updateInterval } from '../maps/common'

export class GhostCharacter extends Character {
    private skillCooldownTime: number = 15 / updateInterval // 스킬 쿨다운 시간 (초)
    private skillDurationTime: number = 5 / updateInterval // 스킬 지속 시간 (초)
    private currentSkillCooldown: number = 0 // 현재 남은 쿨다운 시간
    private currentSkillDuration: number = 0 // 현재 남은 스킬 지속 시간
    constructor(params: {
        id: string
        nickName: string
        position: Position
        color: string
    }) {
        super({ ...params, charType: CharacterType.GHOST })
    }

    getMaxSpeed(): number {
        return 16 // 스킬 사용 시 속도 증가
    }

    useSkill() {
        if (this.currentSkillCooldown <= 0) {
            this.isSkillActive = true
            this.currentSkillDuration = this.skillDurationTime
            this.currentSkillCooldown = this.skillCooldownTime
        } else {
            return
        }
    }

    update() {
        super.update()
        if (this.isSkillActive) {
            // 스턴을 길게 걸리면 스킬 종료 (선물뺏기는 당해도 스킬 안끊김)
            if (this.eventBlock > 6) {
                this.isSkillActive = false
                this.currentSkillDuration = 0
            }
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
            totalSkillCooldown: this.skillCooldownTime,
        }
    }
}
