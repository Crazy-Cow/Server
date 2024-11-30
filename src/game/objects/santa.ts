// santa.ts
import { Character, Position } from './player'
import { CHARACTER } from './player.constant'
import { CharacterType, updateInterval } from '../maps/common'

export class SantaCharacter extends Character {
    private skillDurationTime: number = 5 / updateInterval // 스킬 지속 시간 (초)
    private currentSkillDuration: number = 0 // 현재 남은 스킬 지속 시간
    private bonusSpeed: number = 0 // 부스터 아이템을 먹었을때 추가속도

    constructor(params: {
        id: string
        nickName: string
        position: Position
        color: string
    }) {
        super({
            ...params,
            charType: CharacterType.SANTA,
            currentSkillCooldown: 0,
            totalSkillCooldown: 15 / updateInterval,
            speed: CHARACTER.SANTA_BASE_SPEED,
        })
    }

    getMaxSpeed(): number {
        return this.isSkillActive
            ? CHARACTER.SANTA_MAX_SPEED + this.bonusSpeed
            : CHARACTER.SANTA_BASE_SPEED + this.bonusSpeed // 스킬 사용 시 속도 증가
    }

    useSkill() {
        if (this.currentSkillCooldown <= 0) {
            this.isSkillActive = true
            this.currentSkillDuration = this.skillDurationTime
            this.currentSkillCooldown = this.totalSkillCooldown
        } else {
            return
        }
    }

    update() {
        super.update()
        if (this.isSkillActive) {
            // 스턴을 길게 걸리면 스킬 종료 (선물뺏기는 당해도 스킬 안끊김)
            if (this.eventBlock > CHARACTER.ITEM_EVENT_BLOCK) {
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
            totalSkillCooldown: this.totalSkillCooldown,
        }
    }
}
