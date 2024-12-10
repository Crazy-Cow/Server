// santa.ts
import { Character, CharacterCommonProps } from './player'
import { CHARACTER } from './player.constant'
import { CharacterType, updateInterval } from '../maps/common'

export class SantaCharacter extends Character {
    private skillDurationTime: number = 6 / updateInterval // 스킬 지속 시간 (초)
    private currentSkillDuration: number = 0 // 현재 남은 스킬 지속 시간

    constructor(params: CharacterCommonProps) {
        super({
            ...params,
            charType: CharacterType.SANTA,
            currentSkillCooldown: 0,
            totalSkillCooldown: 12 / updateInterval,
            basespeed: CHARACTER.SANTA_BASE_SPEED,
            speed: CHARACTER.SANTA_BASE_SPEED,
        })
    }

    getMaxSpeed(): number {
        return this.speed
    }

    getSkillSpeedBonus(): number {
        // 산타 스킬이 활성화되고 스킬 지속 시간이 남아있으면 보너스 속도 반환
        if (this.isSkillActive && this.currentSkillDuration > 0) {
            return CHARACTER.SANTA_SKILL_SPEED
        }
        return 0
    }

    useSkill() {
        super.useSkill()

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

        if (this.isSkillInput) {
            if (this.currentSkillCooldown <= 0) {
                this.useSkill()
            }
            this.isSkillInput = false
        }

        if (this.currentSkillCooldown > 0) {
            this.currentSkillCooldown -= 1
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
