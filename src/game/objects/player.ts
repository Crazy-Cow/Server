export type Position = { x: number; y: number; z: number }

export type Directions = {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
}

export class Character {
    id: string
    nickName: string
    position: Position
    bodyColor: string
    hairColor: string
    bellyColor: string
    velocity: Position
    hasTail: boolean

    isOnGround: boolean
    shift: boolean
    isBeingStolen: boolean

    constructor({
        id,
        nickName,
        position,
        color,
    }: {
        id: string
        nickName: string
        position: Position
        color: string
    }) {
        this.id = id
        this.nickName = nickName
        this.position = position
        this.bodyColor = color
        this.hairColor = color
        this.bellyColor = 'white'
        this.velocity = { x: 0, y: 0, z: 0 }
        this.isOnGround = true
        this.hasTail = false
        this.shift = false
        this.isBeingStolen = false
    }

    setHasTail(hasTail: boolean) {
        this.hasTail = hasTail
    }
}
