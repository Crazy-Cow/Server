// rabbit.ts
import { Character, Position } from './player'
import { CharacterType } from '../maps/common'
import { updateInterval } from '../maps/common'

export class RabbitCharacter extends Character {
    private skillCooldownTime: number = 5 * updateInterval // 스킬 쿨다운 시간 (초)
    private currentSkillCooldown: number = 0 // 현재 남은 쿨다운 시간

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
        if (this.currentSkillCooldown <= 0) {
            this.isSkillActive = true // 스킬 사용 상태 표시 (다른 클라이언트에게 알림)
            this.teleportForward(20) // 20만큼 앞으로 순간이동
            this.currentSkillCooldown = this.skillCooldownTime // 쿨다운 초기화
        } else {
            // Todo: 이런 메세지를 FE에서 보여줄수있으면 좋은데
            // 어차피 쿨다운 시간자체를 FE에 보내고있으니깐 알아서 핸들링 해도될거같기도하고
            // console.log('스킬이 아직 쿨다운 중입니다.')
        }
    }

    private teleportForward(distance: number) {
        const direction = this.getMovementDirection()
        if (direction) {
            const newPosition = {
                x: this.position.x + direction.x * distance,
                y: this.position.y,
                z: this.position.z + direction.z * distance,
            }
            if (this.isValidPosition(newPosition)) {
                this.position = newPosition
            } else {
                console.log('순간이동할 위치가 유효하지 않습니다.')
            }
        } else {
            console.log('움직이는 방향이 없어 순간이동할 수 없습니다.')
        }
    }

    // 이동 방향을 계산하는 메서드
    private getMovementDirection(): { x: number; z: number } | null {
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2)
        if (speed === 0) {
            return null
        }
        return {
            x: this.velocity.x / speed,
            z: this.velocity.z / speed,
        }
    }

    private isValidPosition(position: Position): boolean {
        // Toto : 맵 오브젝트 위치랑 겹치면 감지해야할거같음
        if (position) {
            return true
        }
        return true
    }

    update() {
        super.update()
        if (this.currentSkillCooldown > 0) {
            this.currentSkillCooldown -= 1
        }

        if (this.isSkillActive) {
            this.isSkillActive = false
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
        }
    }
}
