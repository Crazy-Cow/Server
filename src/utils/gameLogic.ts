interface Player {
    id: string
    segments: { x: number; y: number }[]
    direction: string
    alive: boolean
    score: number
    color: string
}

interface Food {
    x: number
    y: number
}

class Game {
    players: Player[] = []

    foods: Food[] = []

    gridSize: number = 20

    canvasSize: number = 400

    addPlayer(id: string): void {
        const newPlayer: Player = {
            id,
            segments: [
                {
                    x: Math.floor(Math.random() * this.gridSize),
                    y: Math.floor(Math.random() * this.gridSize),
                },
            ],
            direction: 'UP',
            alive: true,
            score: 0,
            color: this.getRandomColor(),
        }

        // Ensure the player starts at a position that is not occupied
        while (this.isPositionOccupied(newPlayer.segments[0])) {
            newPlayer.segments[0].x = Math.floor(Math.random() * this.gridSize)
            newPlayer.segments[0].y = Math.floor(Math.random() * this.gridSize)
        }
        this.players.push(newPlayer)
    }

    removePlayer(id: string): void {
        this.players = this.players.filter((player) => player.id !== id)
    }

    movePlayer(id: string, direction: string): void {
        const player = this.players.find((p) => p.id === id)
        if (player) {
            player.direction = direction
        }
    }

    update(): void {
        for (const player of this.players) {
            if (player.alive) {
                this.movePlayerLogic(player)
                if (this.checkCollision(player)) {
                    player.alive = false
                }
            }
        }
    }

    private movePlayerLogic(player: Player): void {
        const head = { ...player.segments[0] }
        switch (player.direction) {
            case 'UP':
                head.y--
                if (head.y < 0) head.y = this.gridSize - 1 // Wrap around to bottom
                break
            case 'DOWN':
                head.y++
                if (head.y >= this.gridSize) head.y = 0 // Wrap around to top
                break
            case 'LEFT':
                head.x--
                if (head.x < 0) head.x = this.gridSize - 1 // Wrap around to right
                break
            case 'RIGHT':
                head.x++
                if (head.x >= this.gridSize) head.x = 0 // Wrap around to left
                break
        }
        player.segments.unshift(head)
        if (!this.eatFood(player)) {
            player.segments.pop()
        }
    }

    private checkCollision(player: Player): boolean {
        const head = player.segments[0]
        for (let i = 1; i < player.segments.length; i++) {
            if (
                head.x === player.segments[i].x &&
                head.y === player.segments[i].y
            ) {
                return true
            }
        }
        for (const otherPlayer of this.players) {
            if (otherPlayer !== player) {
                for (const segment of otherPlayer.segments) {
                    if (head.x === segment.x && head.y === segment.y) {
                        return true
                    }
                }
            }
        }
        return false
    }

    private eatFood(player: Player): boolean {
        const head = player.segments[0]
        for (let i = 0; i < this.foods.length; i++) {
            if (head.x === this.foods[i].x && head.y === this.foods[i].y) {
                this.foods.splice(i, 1)
                player.score += 10
                this.generateFood()
                return true
            }
        }
        return false
    }

    generateFood(): void {
        const food: Food = {
            x: Math.floor(Math.random() * this.gridSize),
            y: Math.floor(Math.random() * this.gridSize),
        }
        this.foods.push(food)
    }

    isOver(): boolean {
        return this.players.filter((player) => player.alive).length <= 1
    }

    getWinners(): Player[] {
        const alivePlayers = this.players.filter((player) => player.alive)
        return alivePlayers.length > 0
            ? alivePlayers
            : [
                  {
                      id: 'No Winner',
                      segments: [],
                      direction: '',
                      alive: false,
                      score: 0,
                      color: 'gray',
                  },
              ]
    }

    getState(): { players: Player[]; foods: Food[] } {
        return {
            players: this.players,
            foods: this.foods,
        }
    }

    private isPositionOccupied(position: { x: number; y: number }): boolean {
        // 음식과 충돌 체크
        for (const food of this.foods) {
            if (food.x === position.x && food.y === position.y) {
                return true
            }
        }
        // 다른 플레이어와 충돌 체크
        for (const player of this.players) {
            for (const segment of player.segments) {
                if (segment.x === position.x && segment.y === position.y) {
                    return true
                }
            }
        }
        return false
    }

    private getRandomColor(): string {
        const letters = '0123456789ABCDEF'
        let color = '#'
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)]
        }
        return color
    }
}

export default Game
