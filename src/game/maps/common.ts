import {
    SocketEmitEvtDataGameOver,
    SocketEmitEvtDataGameState,
} from 'socket/types/emit'
import { Character, Position } from '../objects/player'

const GROUND_POS = {
    x: 0,
    y: -1, // y축에서 바닥이 약간 아래로 설정됩니다.
    z: 0,
}

const PREDEFINED_POSITIONS: Position[] = [
    { x: -4, y: 1, z: 4 },
    { x: 7, y: 1, z: -7 },
    { x: 14, y: 1, z: 12 },
    { x: 12, y: 1, z: 33 },
    { x: 36, y: 1, z: 20 },
    { x: 45, y: 1, z: -10 },
    { x: 8, y: 1, z: -30 },
    { x: -32, y: 1, z: -32 },
    { x: -40, y: 1, z: -1 },
    { x: -52, y: 1, z: 28 },
    { x: -17.3, y: 8, z: 2.85 },
    { x: -12, y: 1, z: 57 },
    { x: -1, y: 1, z: -64 },
    { x: -16, y: 1, z: 27 },
    { x: -31, y: 1, z: 22 },
]

const MAX_GROUND = 80
const MAX_HEIGHT = 33

export const updateInterval = 1 / 5

const charType = 1
// Todo: 플레이시 받음

export type MapInitialType = { remainRunningTime: number }
export type MapStartLoopType = {
    handleGameState: (data: SocketEmitEvtDataGameState) => void
    handleGameOver: (data: SocketEmitEvtDataGameOver) => void
}

export class CommonMap {
    private remainRunningTime = 0
    private loopIdToReduceTime?: NodeJS.Timeout
    private loopIdToUpdateGameState?: NodeJS.Timeout
    private availablePositions: Position[] = [...PREDEFINED_POSITIONS]

    characters: Character[] = []

    constructor({ remainRunningTime }: MapInitialType) {
        this.remainRunningTime = remainRunningTime
    }

    init() {}

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

    addCharacter({ id, nickName }: { id: string; nickName: string }) {
        const position = this.generateRandomPosition()
        let color = this.generateRandomHexColor()

        while (this.checkDupColor(color)) {
            color = this.generateRandomHexColor()
        }

        const character = new Character({
            id,
            position,
            charType,
            nickName,
            color,
        })
        this.characters.push(character)
    }

    removeCharacter(id: string) {
        this.characters = this.characters.filter((char) => char.id !== id)
    }

    convertGameState(): SocketEmitEvtDataGameState {
        return {
            remainRunningTime: this.remainRunningTime,
            characters: this.characters.map((char) => ({
                id: char.id,
                nickName: char.nickName,
                charType: char.charType,
                position: char.position,
                charColor: char.charColor,
                velocity: char.velocity,
                giftCnt: char.giftCnt,
                isBeingStolen: char.isBeingStolen,
                steal: char.steal,
                skill: char.skill,
                protect: char.protect,
            })),
        }
    }

    findWinner(): SocketEmitEvtDataGameOver {
        let winner = this.characters[0]

        for (const character of this.characters) {
            if (character.giftCnt > winner.giftCnt) {
                winner = character
            }
        }

        return { winner: { nickName: winner.nickName } }
    }

    private isValidPosition(position: Position): boolean {
        const pos = Math.sqrt(position.x ** 2 + position.z ** 2)
        return pos <= MAX_GROUND && position.y >= GROUND_POS.y
    }

    updateGameState() {
        this.characters.forEach((character) => {
            // 검증로직
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
    }

    private resetEventkey(): void {
        this.characters.forEach((character) => {
            character.steal = false
            character.skill = false
            character.isBeingStolen = false
            if (character.protect > 0) {
                character.protect -= 1
            }
        })
    }

    startGameLoop({ handleGameState, handleGameOver }: MapStartLoopType) {
        this.loopIdToReduceTime = setInterval(() => {
            this.remainRunningTime -= 1

            if (this.isGameOver()) {
                this.stopGameLoop()
                const data = this.findWinner()
                handleGameOver(data)
            }
        }, 1000)

        this.loopIdToUpdateGameState = setInterval(() => {
            this.updateGameState()

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
