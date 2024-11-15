import * as CANNON from 'cannon-es'
import { Character, Position } from '../objects/player'

const GROUND_SIZE = {
    x: 25,
    y: 1,
    z: 25,
}
const GROUND_POS = {
    x: 0,
    y: -1, // y축에서 바닥이 약간 아래로 설정됩니다.
    z: 0,
}

export class CommonMap {
    private updateInterval: number
    world: CANNON.World
    characters: Character[] = []
    characterMaterial: CANNON.Material
    groundMaterial: CANNON.Material
    private intervalId?: NodeJS.Timeout

    constructor() {
        this.updateInterval = 1 / 60 // 60 FPS
        this.world = new CANNON.World()
        this.characterMaterial = new CANNON.Material('characterMaterial')
        this.groundMaterial = new CANNON.Material('groundMaterial')

        this.initWorld()
    }

    private initWorld() {
        this.world.gravity.set(0, -9.82, 0) // 중력 설정 (y축 방향으로 -9.82)
        this.createGround()
        this.setCollision()
    }

    private setCollision() {
        this.world.addContactMaterial(
            new CANNON.ContactMaterial(
                this.characterMaterial,
                this.groundMaterial,
                { friction: 0.9, restitution: 0.0 }
            )
        )
    }

    private createGround() {
        const groundBody = new CANNON.Body({
            mass: 0, // 바닥은 움직이지 않도록 질량을 0으로 설정
            material: this.groundMaterial,
            shape: new CANNON.Box(
                new CANNON.Vec3(GROUND_SIZE.x, GROUND_SIZE.y, GROUND_SIZE.z)
            ),
            position: new CANNON.Vec3(GROUND_POS.x, GROUND_POS.y, GROUND_POS.z),
        })

        this.world.addBody(groundBody)
        return groundBody
    }

    private generateRandomPosition(): Position {
        return {
            x: GROUND_POS.x + Math.random() * 10,
            y: GROUND_POS.y + 2,
            z: GROUND_POS.z + Math.random() * 10,
        }
    }

    private resetPosition(character: Character) {
        const newPosition = this.generateRandomPosition()
        if (character.cannonBody) {
            character.cannonBody.position.set(
                newPosition.x,
                newPosition.y,
                newPosition.z
            )
            character.cannonBody.velocity.set(0, 0, 0) // 속도도 초기화
            character.cannonBody.angularVelocity.set(0, 0, 0) // 각속도 초기화
        }
        character.position = newPosition
        character.velocity = { x: 0, y: 0, z: 0 }
        character.isOnGround = true
        console.log(`Character ${character.id} reset to initial position.`)
    }

    private checkAndUpdatePosition(character: Character) {
        if (
            Math.abs(character.position.x) > GROUND_SIZE.x + 5 ||
            Math.abs(character.position.y) > GROUND_SIZE.y + 5 ||
            Math.abs(character.position.z) > GROUND_SIZE.z + 5
        ) {
            this.resetPosition(character)
        } else {
            character.updatePosition()
        }
    }

    findCharacter(id: string) {
        return this.characters.find((char) => char.id === id)
    }

    addCharacter(id: string) {
        const position = this.generateRandomPosition()
        const character = new Character(id, position, this.characterMaterial)

        this.characters.push(character)
        if (character.cannonBody) this.world.addBody(character.cannonBody)
    }

    removeCharacter(id: string) {
        const character = this.characters.find((char) => char.id === id)
        if (character && character.cannonBody) {
            this.world.removeBody(character.cannonBody)
        }
        this.characters = this.characters.filter((char) => char.id !== id)
    }

    convertGameState() {
        return this.characters.map((char) => ({
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

    updateGameState() {
        this.world.step(this.updateInterval)
        this.characters.forEach((character) => {
            this.checkAndUpdatePosition(character)
        })
    }

    startGameLoop(emitter: (data: unknown) => void) {
        this.intervalId = setInterval(() => {
            this.updateGameState()
            const gameState = this.convertGameState()
            emitter(gameState) // 특정 방이나 전체에 상태를 브로드캐스트
        }, 1000 * this.updateInterval)
    }

    stopGameLoop() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = undefined
        }
    }
}
