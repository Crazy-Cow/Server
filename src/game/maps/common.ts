import {
    EmitEventName,
    SocketEmitEvtDataGameOver,
    SocketEmitEvtDataGameState,
} from 'socket/types/emit'
import { Character, Position } from '../objects/player'
import { RabbitCharacter } from '../objects/rabbit'
import { SantaCharacter } from '../objects/santa'
import { Socket } from 'socket.io'
import { GhostCharacter } from '../objects/ghost'
import { Item, ItemType } from '../objects/item'
import scaledObjects from '../utils/mapObjects'
import ITEM from '../objects/item.const'

const GROUND_POS = {
    x: 0,
    y: -1, // y축에서 바닥이 약간 아래로 설정됩니다.
    z: 0,
}

const PREDEFINED_POSITIONS: Position[] = [
    { x: -4, y: 2, z: 4 },
    { x: 7, y: 2, z: -7 },
    { x: 14, y: 2, z: 12 },
    { x: 12, y: 2, z: 33 },
    { x: 36, y: 2, z: 20 },
    { x: 45, y: 2, z: -10 },
    { x: 8, y: 2, z: -30 },
    { x: -32, y: 2, z: -32 },
    { x: -40, y: 2, z: -1 },
    { x: -52, y: 2, z: 28 },
    { x: -17.3, y: 10, z: 2.85 },
    { x: -12, y: 2, z: 57 },
    { x: -1, y: 2, z: -64 },
    { x: -16, y: 2, z: 27 },
    { x: -31, y: 2, z: 22 },
]

export enum CharacterType {
    RABBIT = 1,
    SANTA = 2,
    GHOST = 3,
}

const MAX_GROUND = 85
const MAX_HEIGHT = 33
export const updateInterval = 1 / 5

export type MapInitialType = { roomId: string; remainRunningTime: number }
export type MapStartLoopType = {
    handleGameState: (data: SocketEmitEvtDataGameState) => void
    handleGameOver: (data: SocketEmitEvtDataGameOver) => void
}

export class CommonMap {
    private roomId = ''
    private socket: Socket
    private remainRunningTime = 0
    private loopIdToReduceTime?: NodeJS.Timeout
    private loopIdToUpdateGameState?: NodeJS.Timeout
    private availablePositions: Position[] = [...PREDEFINED_POSITIONS]

    characters: Character[] = []
    items: Item[] = []

    constructor({ roomId, remainRunningTime }: MapInitialType) {
        this.roomId = roomId
        this.remainRunningTime = remainRunningTime
    }

    init() {
        this.spawnInitialItems()
    }

    getRoomId() {
        return this.roomId
    }

    registerSocket(socket: Socket) {
        this.socket = socket
    }

    broadcast(emitMessage: EmitEventName, data: unknown) {
        // self
        this.socket.emit<EmitEventName>(emitMessage, data)
        // the other
        const roomId = this.getRoomId()
        this.socket.to(roomId).emit<EmitEventName>(emitMessage, data)
    }

    private spawnInitialItems() {
        for (let i = 0; i < 5; i++) {
            this.spawnNewItem()
        }
    }

    private spawnNewItem() {
        const id = this.generateItemId()
        const type = this.getRandomItemType()
        const position = this.getRandomItemPosition()

        const item = new Item(id, type, position)
        this.items.push(item)
    }

    private generateItemId(): string {
        return `item-${Date.now()}-${Math.random()}`
    }

    private getRandomItemType(): ItemType {
        const randonNum = Math.random()
        if (randonNum <= ITEM.BOOST_PROB / ITEM.TOTAL_PROB) {
            return ItemType.BOOST
        } else if (
            randonNum <=
            (ITEM.BOOST_PROB + ITEM.SHIELD_PROB) / ITEM.TOTAL_PROB
        ) {
            return ItemType.SHIELD
        } else if (
            randonNum <=
            (ITEM.BOOST_PROB + ITEM.SHIELD_PROB + ITEM.THUNDER_PROB) /
                ITEM.TOTAL_PROB
        ) {
            return ItemType.THUNDER
        } else {
            return ItemType.GIFT
        }
    }

    private getRandomItemPosition(): Position {
        let position: Position
        let isValidPosition = false

        while (!isValidPosition) {
            // x, z 좌표는 맵의 범위 내에서 랜덤하게 생성 (예: -MAX_GROUND ~ MAX_GROUND)
            const x = (Math.random() - 0.5) * (MAX_GROUND - 10)
            const y = (Math.random() + 0.1) * 10 //  1 ~ 11 사이
            const z = (Math.random() - 0.5) * (MAX_GROUND - 10)

            position = { x, y, z }

            // mapObject와 겹치지 않는지 확인
            if (this.isValidItemPosition(position)) {
                isValidPosition = true
            }
        }

        return position
    }

    private isValidItemPosition(position: Position): boolean {
        // mapObject와 겹치지 않는지 확인하는 로직
        for (const obj of scaledObjects) {
            const min = obj.boundingBox.min
            const max = obj.boundingBox.max

            if (
                position.x >= min.x &&
                position.x <= max.x &&
                position.y >= min.y &&
                position.y <= max.y &&
                position.z >= min.z &&
                position.z <= max.z
            ) {
                return false
            }
        }

        return true
    }

    private checkItemPickup() {
        for (const character of this.characters) {
            if (character.items.length >= 2) {
                continue // 이미 최대 아이템 소지 중인 경우 건너뜀
            }

            for (const item of this.items) {
                const distanceSquared = this.calculateDistance(
                    character.position,
                    item.position
                )

                if (distanceSquared <= ITEM.ITEM_PICKUP_DISTANCE ** 2) {
                    this.handleItemPickup(character, item)
                    break // 한 번에 하나의 아이템만 획득
                }
            }
        }
    }

    private handleItemPickup(character: Character, item: Item) {
        // 아이템을 플레이어의 인벤토리에 추가
        character.items.push(item.type)

        // 맵에서 아이템 제거 및 재생성
        this.respawnItem(item.id)
    }

    respawnItem(itemId: string) {
        // 기존 아이템 제거
        this.items = this.items.filter((item) => item.id !== itemId)

        // 15초 후에 새로운 아이템 생성
        setTimeout(() => {
            this.spawnNewItem()
        }, 15000)
    }

    handleTunderItemUse(character: Character) {
        const userItem = character.items[0]
        if (userItem === ItemType.THUNDER) {
            this.applyThunderEffect(character)
        }
    }
    private applyThunderEffect(caster: Character) {
        for (const other of this.characters) {
            if (other.id !== caster.id) {
                other.thunderEffect.push(2 / updateInterval) // 2초 시전 시간
            }
        }
    }

    private generateRandomPosition(): Position {
        if (this.availablePositions.length === 0) {
            throw new Error('할당할 수 있는 위치 더 이상 없')
        }

        const index = Math.floor(Math.random() * this.availablePositions.length)
        const position = this.availablePositions.splice(index, 1)[0]
        return position
    }

    public calculateDistance(pos1: Position, pos2: Position): number {
        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const dz = pos2.z - pos1.z

        return dx * dx + dy * dy + dz * dz
    }

    private generateRandomHexColor(): string {
        const color = Math.floor(Math.random() * 16777215).toString(16)
        return '#' + color.padStart(6, '0')
    }

    checkDupColor(color: string) {
        return this.characters.some((other) => other.charColor == color)
    }

    findCharacter(id: string) {
        return this.characters.find((char) => char.id === id)
    }

    addCharacter({
        id,
        nickName,
        charType,
    }: {
        id: string
        nickName: string
        charType: CharacterType
    }) {
        const position = this.generateRandomPosition()
        let color = this.generateRandomHexColor()

        while (this.checkDupColor(color)) {
            color = this.generateRandomHexColor()
        }

        let character: Character

        switch (charType) {
            case CharacterType.RABBIT:
                character = new RabbitCharacter({
                    id,
                    nickName,
                    position,
                    color,
                })
                break
            case CharacterType.SANTA:
                character = new SantaCharacter({
                    id,
                    nickName,
                    position,
                    color,
                })
                break
            case CharacterType.GHOST:
                character = new GhostCharacter({
                    id,
                    nickName,
                    position,
                    color,
                })
                break
            // 추가 캐릭터 타입 처리...
            default:
                throw new Error('Unknown character type')
        }

        this.characters.push(character)
    }

    removeCharacter(id: string) {
        this.characters = this.characters.filter((char) => char.id !== id)
    }

    convertGameState(): SocketEmitEvtDataGameState {
        return {
            remainRunningTime: this.remainRunningTime,
            characters: this.characters.map((char) => char.getClientData()),
            mapItems: this.items.map((item) => ({
                id: item.id,
                type: item.type,
                position: item.position,
            })),
        }
    }

    // (will be deprecated)
    findWinner(): SocketEmitEvtDataGameOver['winner'] {
        let winner = this.characters[0]

        for (const character of this.characters) {
            if (character.giftCnt > winner.giftCnt) {
                winner = character
            }
        }

        return { nickName: winner.nickName }
    }
    // (will be deprecated)

    private isValidPosition(position: Position): boolean {
        const pos = Math.sqrt(position.x ** 2 + position.z ** 2)
        return pos <= MAX_GROUND && position.y >= GROUND_POS.y
    }

    updateGameState() {
        this.characters.forEach((character) => {
            character.update()
            // Todo: 밑의 코드가 맵 유효영역체크인데 함수로 만들면 좋을거같기도
            if (!this.isValidPosition(character.position)) {
                character.velocity = { x: 0, y: 0, z: 0 }
                character.position = {
                    x: character.position.x * 0.9,
                    y: GROUND_POS.y + 2,
                    z: character.position.z * 0.9,
                }
            }
            if (character.position.y >= MAX_HEIGHT) {
                character.velocity.y = 0
                character.position.y = 30
            }
        })
        this.checkItemPickup()
    }

    private resetEventkey(): void {
        this.characters.forEach((character) => {
            character.stolen = false
            character.steal = false
        })
    }

    startGameLoop({ handleGameState, handleGameOver }: MapStartLoopType) {
        this.loopIdToReduceTime = setInterval(() => {
            this.remainRunningTime -= 1

            if (this.isGameOver()) {
                this.stopGameLoop()
                const winner = this.findWinner()
                handleGameOver({
                    winner,
                    roomId: this.getRoomId(),
                })
            }
        }, 1000)

        this.loopIdToUpdateGameState = setInterval(async () => {
            await this.updateGameState()

            const gameState = this.convertGameState()
            handleGameState(gameState)
            this.resetEventkey()
        }, 1000 * updateInterval)
    }

    stopGameLoop() {
        if (this.loopIdToReduceTime) {
            clearInterval(this.loopIdToReduceTime)
            this.loopIdToReduceTime = undefined
        }

        if (this.loopIdToUpdateGameState) {
            clearInterval(this.loopIdToUpdateGameState)
            this.loopIdToUpdateGameState = undefined
        }
    }

    private isGameOver(): boolean {
        const cond1 = this.remainRunningTime <= 0
        const cond2 = this.characters.length == 1
        return cond1 || cond2
    }
}
