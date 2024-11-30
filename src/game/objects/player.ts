import { ItemType } from './item'

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
    stolen: boolean
    eventBlock: number
    protect: number
    isSkillActive: boolean // 스킬 활성화 상태
    isSkillInput: boolean // 스킬 사용 입력
    direction: Position
    currentSkillCooldown: number
    totalSkillCooldown: number
    speed: number
    items: ItemType[] // character가 보유한 아이템
    constructor({
        id,
        nickName,
        charType,
        position,
        color,
        currentSkillCooldown,
        totalSkillCooldown,
        speed,
    }: {
        id: string
        nickName: string
        charType: number
        position: Position
        color: string
        currentSkillCooldown: number
        totalSkillCooldown: number
        speed: number
    }) {
        this.id = id
        this.nickName = nickName
        this.charType = charType
        this.position = position
        this.charColor = color
        this.velocity = { x: 0, y: 0, z: 0 }
        this.giftCnt = 0
        this.steal = false
        this.stolen = false
        this.eventBlock = 0
        this.protect = 0
        this.isSkillActive = false
        this.isSkillInput = false
        this.direction = { x: 0, y: 0, z: 1 }
        this.currentSkillCooldown = currentSkillCooldown
        this.totalSkillCooldown = totalSkillCooldown
        this.speed = speed
        this.items = []
    }

    getClientData() {
        return {
            id: this.id,
            nickName: this.nickName,
            charType: this.charType,
            position: this.position,
            charColor: this.charColor,
            velocity: this.velocity,
            giftCnt: this.giftCnt,
            eventBlock: this.eventBlock,
            stealMotion: this.steal,
            stolenMotion: this.stolen,
            isSkillActive: this.isSkillActive,
            protectMotion: this.protect,
            currentSkillCooldown: this.currentSkillCooldown,
            totalSkillCooldown: this.totalSkillCooldown,
            speed: this.speed,
            items: this.items,
        }
    }

    abstract getMaxSpeed(): number

    isValidVelocity(velocity: Position): boolean {
        const maxSpeed = this.getMaxSpeed() + 1
        const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2)
        return speed <= maxSpeed && velocity.y <= 10 && velocity.y >= -40
    }

    getMovementDirection(velocity: Position): Position {
        const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2)
        return { x: velocity.x / speed, y: 0, z: velocity.z / speed }
    }

    setGiftCnt(giftCnt: number) {
        this.giftCnt = giftCnt
    }

    update() {
        if (this.protect > 0) {
            this.protect -= 1
        }
        if (this.eventBlock > 0) {
            this.eventBlock -= 1
        }
    }
}
