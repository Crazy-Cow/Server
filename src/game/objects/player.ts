import * as CANNON from 'cannon-es'

export type Position = { x: number; y: number; z: number }

export type Directions = {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
    angleRad: number
}

const CHARACTER_SIZE = 1

export class Character {
    id: string
    position: Position
    velocity: Position
    acceleration: Position

    bodyColor: string
    hairColor: string
    bellyColor: string
    isOnGround: boolean
    directions: Directions
    hasTail: boolean
    cannonBody: CANNON.Body
    angleRad: number
    shift: boolean
    jump: boolean

    facingAngleRad: number
    isBeingStolen: boolean

    constructor(id: string, position: Position, material: CANNON.Material) {
        this.id = id
        this.position = position
        this.bodyColor = this.generateRandomHexColor()
        this.hairColor = this.generateRandomHexColor()
        this.bellyColor = this.generateRandomHexColor()
        this.velocity = { x: 0, y: 0, z: 0 }
        this.acceleration = { x: 0, y: 0, z: 0 }
        this.isOnGround = true
        this.directions = {
            up: false,
            down: false,
            left: false,
            right: false,
            angleRad: 0,
        }
        this.hasTail = Math.random() > 0.5 // TODO // characters.length % 2 === 0,
        this.shift = false
        this.isBeingStolen = false

        const body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material,
            shape: new CANNON.Sphere(CHARACTER_SIZE),
        })
        this.cannonBody = body
    }

    private generateRandomHexColor(): string {
        const color = Math.floor(Math.random() * 16777215).toString(16)
        return '#' + color.padStart(6, '0')
    }

    updatePosition() {
        if (this.cannonBody) {
            this.position = {
                x: this.cannonBody.position.x,
                y: this.cannonBody.position.y,
                z: this.cannonBody.position.z,
            }
            this.velocity = {
                x: this.cannonBody.velocity.x,
                y: this.cannonBody.velocity.y,
                z: this.cannonBody.velocity.z,
            }
        }
    }
}
