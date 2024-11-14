import * as CANNON from 'cannon-es'

export type Position = [number, number, number]
export type Directions = {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
}

export class Character {
    id: string
    position: Position
    velocity: Position
    bodyColor: string
    hairColor: string
    bellyColor: string
    isOnGround: boolean
    directions: Directions
    hasTail: boolean
    cannonBody: CANNON.Body
    angleRad: number
    shift: boolean
    facingAngleRad: number
    isBeingStolen: boolean

    constructor(id: string, position: Position, material: CANNON.Material) {
        this.id = id
        this.position = position
        this.velocity = [0, 0, 0]
        this.bodyColor = Character.generateRandomHexColor()
        this.hairColor = Character.generateRandomHexColor()
        this.bellyColor = Character.generateRandomHexColor()
        this.isOnGround = true
        this.directions = { up: false, down: false, left: false, right: false }
        this.hasTail = Math.random() > 0.5
        this.shift = false
        this.isBeingStolen = false

        // Cannon.js body 설정
        const body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position[0], position[1], position[2]),
            material: material,
        })
        body.addShape(new CANNON.Sphere(1)) // 캐릭터의 크기 설정
        this.cannonBody = body
    }

    static generateRandomHexColor(): string {
        const color = Math.floor(Math.random() * 16777215).toString(16)
        return '#' + color.padStart(6, '0')
    }

    updatePosition() {
        if (this.cannonBody) {
            this.position = [
                this.cannonBody.position.x,
                this.cannonBody.position.y,
                this.cannonBody.position.z,
            ]
            this.velocity = [
                this.cannonBody.velocity.x,
                this.cannonBody.velocity.y,
                this.cannonBody.velocity.z,
            ]
        }
    }
}
