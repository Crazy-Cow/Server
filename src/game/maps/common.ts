import { Character, Position } from '../objects/player'

const GROUND_POS = {
    x: 0,
    y: -1, // y축에서 바닥이 약간 아래로 설정됩니다.
    z: 0,
}

export class CommonMap {
    private updateInterval: number
    characters: Character[] = []
    private intervalId?: NodeJS.Timeout

    constructor() {
        this.updateInterval = 1 / 60 // 60 FPS
    }

    private generateRandomPosition(): Position {
        // TODO: 안겹치게 생성되도록
        return {
            x: GROUND_POS.x + Math.random() * 10,
            y: GROUND_POS.y + 2,
            z: GROUND_POS.z + Math.random() * 10,
        }
    }

    findCharacter(id: string) {
        return this.characters.find((char) => char.id === id)
    }

    addCharacter(id: string) {
        const position = this.generateRandomPosition()
        const character = new Character(id, position)
        this.characters.push(character)
    }

    removeCharacter(id: string) {
        this.characters = this.characters.filter((char) => char.id !== id)
    }

    convertGameState() {
        return this.characters.map((char) => ({
            id: char.id,
            position: char.position,
            bodyColor: char.bodyColor,
            hairColor: char.hairColor,
            bellyColor: char.bellyColor,
            velocity: char.velocity,
            hasTail: char.hasTail,
        }))
    }

    updateGameState() {
        // TODO: 검증로직
    }

    startGameLoop(emitter: (data: unknown) => void) {
        this.intervalId = setInterval(() => {
            this.updateGameState()
            const gameState = this.convertGameState()
            emitter(gameState) // 특정 방이나 전체에 상태를 브로드캐스트
        }, 1000 * this.updateInterval)
    }

    stopGameLoop() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = undefined
        }
    }
}
