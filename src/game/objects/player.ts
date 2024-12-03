import { ItemType } from './item'
import { updateInterval } from '../maps/common'
import { ITEM } from './item.const'
import CHARACTER from './player.constant'

export type CharacterCommonProps = {
    id: string
    nickName: string
    position: Position
    color: string
}

type CharacterExtraProps = {
    charType: number
    currentSkillCooldown: number
    totalSkillCooldown: number
    speed: number
    basespeed: number
}

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
    basespeed: number
    speed: number
    items: ItemType[] // character가 보유한 아이템
    itemDuration: { boost: number; shield: number } // 아이템 효과 남은 지속 시간
    thunderEffect: number[] // 번개 시전 시간 목록
    log: {
        usedItems: Record<ItemType, number>
    }

    constructor({
        id,
        nickName,
        charType,
        position,
        color,
        currentSkillCooldown,
        totalSkillCooldown,
        speed,
        basespeed,
    }: CharacterCommonProps & CharacterExtraProps) {
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
        this.basespeed = basespeed
        this.speed = speed
        this.items = []
        this.itemDuration = { boost: 0, shield: 0 }
        this.thunderEffect = []
        this.log = {
            usedItems: {
                [ItemType.BOOST]: 0,
                [ItemType.SHIELD]: 0,
                [ItemType.THUNDER]: 0,
                [ItemType.GIFT]: 0,
            },
        }
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
            itemDuration: this.itemDuration,
            thunderEffect: this.thunderEffect,
        }
    }

    abstract getMaxSpeed(): number

    isValidVelocity(velocity: Position): boolean {
        const maxSpeed = this.getMaxSpeed() + 1
        const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2)
        return (
            speed <= maxSpeed &&
            velocity.y <= CHARACTER.MAX_YSPEED &&
            velocity.y >= CHARACTER.MIN_YSPEED
        )
    }

    getMovementDirection(velocity: Position): Position {
        const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2)
        return { x: velocity.x / speed, y: 0, z: velocity.z / speed }
    }

    setGiftCnt(giftCnt: number) {
        this.giftCnt = giftCnt
    }

    update() {
        const giftSpeedDecrease = this.giftCnt * ITEM.SPEED_DECREASE_FACTOR
        const calculatedSpeed = this.basespeed - giftSpeedDecrease

        if (this.protect > 0) {
            this.protect -= 1
        }
        if (this.eventBlock > 0) {
            this.eventBlock -= 1
        }
        // 부스터 지속 시간 처리
        if (this.itemDuration.boost > 0) {
            this.itemDuration.boost -= 1
        }

        if (this.itemDuration.boost > 0) {
            this.speed = Math.max(
                this.basespeed / 2 + ITEM.SPEED_UP,
                calculatedSpeed + ITEM.SPEED_UP
            )
        } else {
            this.speed = Math.max(this.basespeed / 2, calculatedSpeed)
        }

        // 쉴드 지속 시간 처리
        if (this.itemDuration.shield > 0) {
            this.itemDuration.shield -= 1
            if (this.itemDuration.shield <= 0) {
                this.protect = 0 // 쉴드 효과 종료
                this.itemDuration.shield = 0
            }
        }

        // 번개 처리
        if (this.thunderEffect.length > 0) {
            for (let i = 0; i < this.thunderEffect.length; i++) {
                this.thunderEffect[i] -= 1
                if (this.thunderEffect[i] <= 0) {
                    if (this.protect <= 0) {
                        this.eventBlock = 2 / updateInterval
                    }
                    this.thunderEffect.splice(i, 1)
                    i--
                }
            }
        }
    }

    useItem() {
        if (this.items.length === 0) {
            return
        }
        const usedItem = this.items.shift() // FIFO 방식으로 아이템 사용
        if (usedItem >= 5 && usedItem <= 0) {
            return
        }

        this.logUsedItem(usedItem)

        switch (usedItem) {
            case ItemType.BOOST:
                this.activateBoost()
                break
            case ItemType.SHIELD:
                this.activateShield()
                break
            case ItemType.THUNDER:
                break
            case ItemType.GIFT:
                this.giftCnt += 1
                break
            default:
                break
        }
    }

    private activateBoost() {
        this.itemDuration.boost = 3 / updateInterval // 3초 지속
    }

    private activateShield() {
        this.itemDuration.shield = 3 / updateInterval // 3초 지속
        this.protect = 3 / updateInterval // 보호 상태 적용
    }

    private logUsedItem(item: ItemType) {
        this.log[item] += 1
    }
}
