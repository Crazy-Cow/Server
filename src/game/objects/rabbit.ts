import { Character, Position } from './player'
import { CHARACTER } from './player.constant'
import { CharacterType, updateInterval } from '../maps/common'
import scaledObjects from '../utils/mapObjects'
import mapPositon from '../utils/positionUtils'

export class RabbitCharacter extends Character {
    private skillPreparationTime: number = 1 // 스킬 시전시간
    private currentSkillPreparationTime: number = 0 // 현재 남은 시전시간

    constructor(params: {
        id: string
        nickName: string
        position: Position
        color: string
    }) {
        super({
            ...params,
            charType: CharacterType.RABBIT,
            currentSkillCooldown: 0,
            totalSkillCooldown: 10 / updateInterval,
            basespeed: CHARACTER.RABBIT_BASE_SPEED,
            speed: CHARACTER.RABBIT_BASE_SPEED,
        })
    }

    getMaxSpeed(): number {
        return this.speed
    }

    useSkill() {
        if (this.currentSkillCooldown <= 0) {
            this.isSkillActive = true // 스킬 사용 상태 표시 (다른 클라이언트에게 알림)
            this.currentSkillPreparationTime = this.skillPreparationTime
            this.currentSkillCooldown = this.totalSkillCooldown // 쿨다운 초기화
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
        if (mapPositon.isValidXZPosition(newPosition)) {
            this.position = this.repositionNearObjects(newPosition)
        }
    }

    private repositionNearObjects(position: Position): Position {
        let calculatedPosition = position
        for (const obj of scaledObjects) {
            const min = obj.boundingBox.min
            const max = obj.boundingBox.max

            if (
                position.x >= min.x &&
                position.x <= max.x &&
                position.y >= min.y &&
                position.y <= max.y &&
                position.z >= min.z &&
                position.z <= max.z
            ) {
                // 겹치는 오브젝트가 있으면 위치를 조정
                const adjustedPosition: Position = {
                    x: position.x,
                    y: max.y + 3, // max.y보다 3만큼 위로 이동
                    z: position.z,
                }
                calculatedPosition = adjustedPosition
            }
        }
        return calculatedPosition
    }

    update() {
        super.update()
        if (this.isSkillActive) {
            this.currentSkillPreparationTime -= 1
            if (this.currentSkillPreparationTime === 0) {
                this.teleportForward(CHARACTER.TELEPORT_DISTANCE)
                mapPositon.repositionInMapBoundary(this)
            } else if (this.currentSkillPreparationTime <= -1) {
                this.isSkillActive = false
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
