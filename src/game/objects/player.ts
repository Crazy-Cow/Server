export type Position = { x: number; y: number; z: number }

export type Directions = {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
}

export abstract class Character {
    id: string
    nickName: string
    charType: number
    position: Position
    charColor: string
    velocity: Position
    giftCnt: number
    steal: boolean
    isBeingStolen: boolean
    skill: boolean
    protect: number
    constructor({
        id,
        nickName,
        charType,
        position,
        color,
    }: {
        id: string
        nickName: string
        charType: number
        position: Position
        color: string
    }) {
        this.id = id
        this.nickName = nickName
        this.charType = charType
        this.position = position
        this.charColor = color
        this.velocity = { x: 0, y: 0, z: 0 }
        this.giftCnt = 0
        this.steal = false
        this.isBeingStolen = false
        this.skill = false
        this.protect = 0
    }

    abstract getMaxSpeed(): number

    isValidVelocity(velocity: Position): boolean {
        const maxSpeed = this.getMaxSpeed()
        const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2)
        return speed <= maxSpeed && velocity.y <= 10 && velocity.y >= -40
    }

    setGiftCnt(giftCnt: number) {
        this.giftCnt = giftCnt
    }

    update() {
        if (this.protect > 0) {
            this.protect -= 1
        }
    }
}
