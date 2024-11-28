// rabbit.ts
import { Character, Position } from './player'
import { CharacterType } from '../maps/common'
import { updateInterval } from '../maps/common'

export class RabbitCharacter extends Character {
    private skillCooldownTime: number = 10 / updateInterval // 스킬 쿨다운 시간 (초)
    private currentSkillCooldown: number = 0 // 현재 남은 쿨다운 시간
    private skillPreparationTime: number = 1 / updateInterval // 스킬 시전시간
    private currentSkillPreparationTime: number = 0 // 현재 남은 시전시간

    constructor(params: {
        id: string
        nickName: string
        position: Position
        color: string
    }) {
        super({ ...params, charType: CharacterType.RABBIT })
    }
    getMaxSpeed(): number {
        return 16 // 기본 속도
    }

    useSkill() {
        if (this.currentSkillCooldown <= 0) {
            this.isSkillActive = true // 스킬 사용 상태 표시 (다른 클라이언트에게 알림)
            this.currentSkillPreparationTime = this.skillPreparationTime
            this.currentSkillCooldown = this.skillCooldownTime // 쿨다운 초기화
        } else {
            return
        }
    }

    private teleportForward(distance: number) {
        const newPosition = {
            x: this.position.x + this.direction.x * distance,
            y: this.position.y,
            z: this.position.z + this.direction.z * distance,
        }
        this.position = this.isValidPosition(newPosition)
    }

    private isValidPosition(position: Position): Position {
        // Toto : 맵 오브젝트 위치랑 겹치면 감지해야할거같음
        return position
    }

    update() {
        super.update()
        if (this.currentSkillCooldown > 0) {
            this.currentSkillCooldown -= 1
        }

        if (this.isSkillActive) {
            this.eventBlock = 1 / updateInterval
            // 스턴 걸리면 스킬 시전 취소 (선물뺏기 제외)
            if (this.eventBlock > 6) {
                this.isSkillActive = false
            }
            this.currentSkillPreparationTime -= 1
            if (this.currentSkillPreparationTime <= 0) {
                this.teleportForward(30)
                this.isSkillActive = false
                this.currentSkillPreparationTime = 0
            }
        }

        if (this.isSkillInput) {
            this.useSkill()
            this.isSkillInput = false // 입력 처리 후 초기화
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
