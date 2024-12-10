import { Character, CharacterCommonProps, Position } from './player'
import { CHARACTER } from './player.constant'
import { CharacterType, updateInterval } from '../maps/common'
import scaledObjects from '../utils/mapObjects'
import mapPositon from '../utils/positionUtils'

export class RabbitCharacter extends Character {
    private skillPreparationTime: number = 1 // 스킬 시전시간
    private currentSkillPreparationTime: number = 0 // 현재 남은 시전시간

    constructor(params: CharacterCommonProps) {
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
        super.useSkill()

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
        // console.log('newPosition', newPosition)
        if (mapPositon.isValidXZPosition(newPosition)) {
            this.position = this.repositionNearObjects(newPosition)
            this.isAwaitingTeleportAck = true
            // console.log('repositionNearObject', this.position)
        }
    }

    private repositionNearObjects(position: Position): Position {
        let calculatedPosition = position
        for (const obj of scaledObjects) {
            const min = obj.boundingBox.min
            const max = obj.boundingBox.max

            if (
                position.x >= min.x - 1 &&
                position.x <= max.x + 1 &&
                position.y >= min.y - 1 &&
                position.y <= max.y + 1 &&
                position.z >= min.z - 1 &&
                position.z <= max.z + 1
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
                // console.log('skill_before', this.position)
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
