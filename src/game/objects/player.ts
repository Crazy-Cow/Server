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
    giftCnt: number

    isOnGround: boolean
    shift: boolean
    isBeingStolen: boolean
    isSteal: boolean
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
        this.giftCnt = 0
        this.shift = false
        this.isBeingStolen = false
        this.isSteal = false
    }

    private generateRandomHexColor(): string {
        const color = Math.floor(Math.random() * 16777215).toString(16)
        return '#' + color.padStart(6, '0')
    }

    setGiftCnt(giftCnt: number) {
        this.giftCnt = giftCnt
    }
}
