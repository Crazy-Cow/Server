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

const GROUND_SIZE = {
    x: 20,
    y: 0,
    z: 20,
}

const MIN_DISTANCE = 3

const MAX_GROUND = 80
const MAX_HEIGHT = 33

const charType = 1
// Todo: 플레이시 받음

export type MapInitialType = { remainRunningTime: number }
export type MapStartLoopType = {
    handleGameState: (data: SocketEmitEvtDataGameState) => void
    handleGameOver: (data: SocketEmitEvtDataGameOver) => void
}

export class CommonMap {
    private updateInterval = 1 / 5 // FPS
    private remainRunningTime = 0
    private loopIdToReduceTime?: NodeJS.Timeout
    private loopIdToUpdateGameState?: NodeJS.Timeout

    characters: Character[] = []

    constructor({ remainRunningTime }: MapInitialType) {
        this.remainRunningTime = remainRunningTime
    }

    init() {}

    private generateRandomPosition(): Position {
        // TODO: 안겹치게 생성되도록
        let position: Position
        do {
            position = {
                x: GROUND_POS.x + Math.random() * GROUND_SIZE.x,
                y: GROUND_POS.y + 2,
                z: GROUND_POS.z + Math.random() * GROUND_SIZE.z,
            }
        } while (!this.isCollisionPosition(position))

        return position
    }

    private isCollisionPosition(newPos: Position): boolean {
        // 기존 캐릭터 위치들과의 충돌 검사
        for (const character of this.characters) {
            const distance = this.calculateDistance(newPos, character.position)
            if (distance < MIN_DISTANCE) {
                return false
            }
        }
        return true
    }

    public calculateDistance(pos1: Position, pos2: Position): number {
        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const dz = pos2.z - pos1.z

        return Math.sqrt(dx * dx + dy * dy + dz * dz)
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
                isSteal: char.isSteal,
                steal: char.steal,
                skill: char.skill,
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
        // TODO: 검증로직
        this.characters.forEach((character) => {
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
        }, 1000 * this.updateInterval)
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
