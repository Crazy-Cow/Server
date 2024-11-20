export type Position = { x: number; y: number; z: number }

export type Directions = {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
}

export class Character {
    id: string
    position: Position
    bodyColor: string
    hairColor: string
    bellyColor: string
    velocity: Position
    hasTail: boolean

    isOnGround: boolean
    shift: boolean
    isBeingStolen: boolean

    constructor(id: string, position: Position) {
        this.id = id
        this.position = position
        this.bodyColor = this.generateRandomHexColor()
        this.hairColor = this.generateRandomHexColor()
        this.bellyColor = this.generateRandomHexColor()
        this.velocity = { x: 0, y: 0, z: 0 }
        this.isOnGround = true
        this.hasTail = false
        this.shift = false
        this.isBeingStolen = false
    }

    private generateRandomHexColor(): string {
        const color = Math.floor(Math.random() * 16777215).toString(16)
        return '#' + color.padStart(6, '0')
    }

    setHasTail(hasTail: boolean) {
        this.hasTail = hasTail
    }
}
