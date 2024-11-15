import { Character, Directions } from '../objects/player'
import * as CANNON from 'cannon-es'

const MAX_SPEED = 10

const handleMove = (character: Character, directions: Directions) => {
    if (character && character.cannonBody) {
        const angleRad = directions.angleRad

        // 카메라 각도에 따른 방향 벡터 계산
        const forwardX = Math.sin(angleRad)
        const forwardZ = Math.cos(angleRad)
        const rightX = Math.cos(angleRad)
        const rightZ = -Math.sin(angleRad)

        let targetVelocityX = 0
        let targetVelocityZ = 0

        if (directions.up) {
            targetVelocityX += forwardX * MAX_SPEED
            targetVelocityZ += forwardZ * MAX_SPEED
        }
        if (directions.down) {
            targetVelocityX -= forwardX * MAX_SPEED
            targetVelocityZ -= forwardZ * MAX_SPEED
        }
        if (directions.left) {
            targetVelocityX += rightX * MAX_SPEED
            targetVelocityZ += rightZ * MAX_SPEED
        }
        if (directions.right) {
            targetVelocityX -= rightX * MAX_SPEED
            targetVelocityZ -= rightZ * MAX_SPEED
        }

        // 현재 속도와 목표 속도 간의 차이를 줄여 이동이 부드럽게 되도록 설정
        character.cannonBody.velocity.x = targetVelocityX
        character.cannonBody.velocity.z = targetVelocityZ

        // 키가 떼어진 상태라면 속도를 완전히 0으로 설정
        if (targetVelocityX === 0 && targetVelocityZ === 0) {
            character.cannonBody.velocity.x = 0
            character.cannonBody.velocity.z = 0
            character.cannonBody.angularVelocity.set(0, 0, 0) // 각속도도 0으로 설정
        }

        const facingAngleRad = Math.atan2(
            character.cannonBody.velocity.x,
            character.cannonBody.velocity.z
        )
        character.facingAngleRad = facingAngleRad
    }
}

const handleJump = (character: Character, jump: boolean) => {
    if (character && jump && character.cannonBody && character.isOnGround) {
        character.cannonBody.applyImpulse(
            new CANNON.Vec3(0, 5, 0),
            character.cannonBody.position
        )
        character.isOnGround = false
    }
}

const handleSift = (character: Character, shift: boolean) => {
    if (character) {
        character.shift = shift
    }
}

export default {
    handleMove,
    handleJump,
    handleSift,
}
