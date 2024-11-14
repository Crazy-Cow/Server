// server/app.ts

import { Server, Socket } from 'socket.io'
import * as CANNON from 'cannon-es'
console.log('cannon_server start')
const io = new Server({ cors: { origin: '*' } })

type Position = [number, number, number]
type Directions = {
    up?: boolean
    down?: boolean
    left?: boolean
    right?: boolean
}
type Character = {
    id: string
    position: Position
    bodyColor: string
    hairColor: string
    bellyColor: string
    velocity: Position
    acceleration: Position
    isOnGround: boolean
    directions: Directions // 추가
    hasTail: boolean
    jump?: boolean
    angleRad?: number // 라디안 값의 각도 저장
    shift?: boolean
    cannonBody?: CANNON.Body
    facingAngleRad?: number
    isBeingStolen?: boolean
}
// Cannon.js 물리 세계 설정
const world = new CANNON.World()
world.gravity.set(0, -9.82, 0) // 중력 설정 (y축 방향으로 -9.82)
// 물리적 캐릭터 재질 설정
const characterMaterial = new CANNON.Material('characterMaterial')
const groundMaterial = new CANNON.Material('groundMaterial')
const groundSize = 50 // 바닥의 너비 및 길이 설정
const groundBody = new CANNON.Body({
    mass: 0, // 바닥은 움직이지 않도록 질량을 0으로 설정
    material: groundMaterial,
})
const groundShape = new CANNON.Box(
    new CANNON.Vec3(groundSize / 2, 1, groundSize / 2)
)
groundBody.addShape(groundShape)
groundBody.position.set(0, -1, 0) // y축에서 바닥이 약간 아래로 설정됩니다.
world.addBody(groundBody)
const defaultContactMaterial = new CANNON.ContactMaterial(
    characterMaterial,
    groundMaterial,
    { friction: 0.9, restitution: 0.0 }
)
world.addContactMaterial(defaultContactMaterial)
const characters: Character[] = []
const CHARACTER_SIZE = 2
const TAIL_STEAL_DISTANCE = 5
const MAX_SPEED = 10
// 캐릭터 위치 생성 함수
const generateRandomPosition = (): Position => {
    return [Math.random() * 10, 2, Math.random() * 10]
}

const generateRandomHexColor = (): string => {
    const color = Math.floor(Math.random() * 16777215).toString(16)
    return '#' + color.padStart(6, '0')
}

const handleCatch = (character: Character) => {
    // 이미 꼬리를 가지고 있다면 훔치지 않음
    if (character.hasTail) return

    for (const otherCharacter of characters) {
        if (
            character.id !== otherCharacter.id &&
            otherCharacter.hasTail &&
            !otherCharacter.isBeingStolen // 다른 캐릭터가 훔쳐지는 중인지 확인
        ) {
            const dx = character.position[0] - otherCharacter.position[0]
            const dz = character.position[2] - otherCharacter.position[2]
            const distance = Math.sqrt(dx * dx + dz * dz)

            if (distance <= TAIL_STEAL_DISTANCE) {
                // 다른 캐릭터를 훔쳐지고 있는 상태로 설정
                otherCharacter.isBeingStolen = true

                // 꼬리를 훔치는 로직
                character.hasTail = true
                otherCharacter.hasTail = false

                console.log(
                    `${character.id} has stolen the tail from ${otherCharacter.id}`
                )

                // 꼬리 훔치기 후 반복 종료
                break
            }
        }
    }
}

// 필요한 데이터를 캐릭터 목록으로 변환하는 함수
function getSerializableCharacters(raw_characters: Character[]) {
    return raw_characters.map((char) => ({
        id: char.id,
        position: char.position,
        bodyColor: char.bodyColor,
        hairColor: char.hairColor,
        bellyColor: char.bellyColor,
        velocity: char.velocity,
        isOnGround: char.isOnGround,
        hasTail: char.hasTail,
        facingAngleRad: char.facingAngleRad,
    }))
}

io.listen(8000)

io.on('connection', (socket: Socket) => {
    console.log('user connected')

    const newPosition = generateRandomPosition()
    const characterBody = new CANNON.Body({
        mass: 1, // 질량 설정
        position: new CANNON.Vec3(
            newPosition[0],
            newPosition[1],
            newPosition[2]
        ),
        material: characterMaterial,
    })
    const shape = new CANNON.Sphere(CHARACTER_SIZE / 2)
    characterBody.addShape(shape)
    world.addBody(characterBody)

    const newCharacter: Character = {
        id: socket.id,
        position: newPosition,
        bodyColor: generateRandomHexColor(),
        hairColor: generateRandomHexColor(),
        bellyColor: generateRandomHexColor(),
        velocity: [0, 0, 0],
        acceleration: [0, 0, 0],
        isOnGround: true,
        directions: { up: false, down: false, left: false, right: false },
        hasTail: characters.length % 2 === 0,
        shift: false,
        angleRad: 0, // 임시값
        cannonBody: characterBody,
    }
    characters.push(newCharacter)

    socket.emit('hello')
    io.emit('characters', getSerializableCharacters(characters))

    // 이동 관련 이벤트
    socket.on('move', (directions: Directions) => {
        const character = characters.find((char) => char.id === socket.id)
        if (character && character.cannonBody) {
            const angleRad = character.angleRad || 0

            // 카메라 각도에 따른 방향 벡터 계산
            const forwardX = -Math.sin(angleRad)
            const forwardZ = -Math.cos(angleRad)
            const rightX = Math.cos(angleRad)
            const rightZ = Math.sin(angleRad)

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
                targetVelocityX -= rightX * MAX_SPEED
                targetVelocityZ -= rightZ * MAX_SPEED
            }
            if (directions.right) {
                targetVelocityX += rightX * MAX_SPEED
                targetVelocityZ += rightZ * MAX_SPEED
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
    })

    socket.on('jump', (jump: boolean) => {
        const character = characters.find((char) => char.id === socket.id)
        if (character && jump && character.cannonBody && character.isOnGround) {
            character.cannonBody.applyImpulse(
                new CANNON.Vec3(0, 5, 0),
                character.cannonBody.position
            )
            character.isOnGround = false
        }
    })

    socket.on('angle', (angleRad: number) => {
        const character = characters.find((char) => char.id === socket.id)
        if (character) {
            character.angleRad = angleRad
        }
    })

    socket.on('shift', (shift: boolean) => {
        const character = characters.find((char) => char.id === socket.id)
        if (character) {
            character.shift = shift
        }
    })

    socket.on('disconnect', () => {
        console.log('user disconnected')

        const index = characters.findIndex(
            (character) => character.id === socket.id
        )
        if (index !== -1) {
            const character = characters[index]
            if (character.cannonBody) {
                world.removeBody(character.cannonBody)
            }
            characters.splice(index, 1)
        }
        io.emit('characters', getSerializableCharacters(characters))
    })
})

// 주기적 물리 세계 업데이트 및 위치 전송
const UPDATE_INTERVAL = 1 / 60 // 60 FPS
setInterval(() => {
    world.step(UPDATE_INTERVAL)

    characters.forEach((character) => {
        character.isBeingStolen = false
        // console.log(character.id, character.position)
    })

    characters.forEach((character) => {
        if (character.cannonBody) {
            const { x, y, z } = character.cannonBody.position
            character.position = [x, y, z]
            character.velocity = [
                character.cannonBody.velocity.x,
                character.cannonBody.velocity.y,
                character.cannonBody.velocity.z,
            ]

            if (character.shift) handleCatch(character)
        }
    })

    // 캐릭터 위치 정보 전송
    io.emit('characters', getSerializableCharacters(characters))
}, 1000 * UPDATE_INTERVAL)
