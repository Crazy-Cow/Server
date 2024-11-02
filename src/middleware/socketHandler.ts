import { Server, Socket } from 'socket.io'
import Game from '../utils/gameLogic'
import dotenv from 'dotenv'
dotenv.config()

const games: Map<string, Game> = new Map()
// const MAX_PLAYERS = parseInt(process.env.MAX_PLAYERS || '4', 10)
function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function startGameLoop(roomCode: string, io: Server): void {
    const game = games.get(roomCode)!
    const interval = setInterval(() => {
        game.update() // 플레이어 움직임 및 충돌 감지
        const gameState = game.getState() // 현재 게임 상태를 가져옵니다.

        // 게임 상태가 제대로 업데이트되었는지 로그로 확인
        console.log(`Updated game state for room ${roomCode}:`, gameState)

        io.to(roomCode).emit('gameState', gameState)

        // 게임 종료 조건 체크
        if (game.isOver()) {
            clearInterval(interval)
            io.to(roomCode).emit('gameOver', game.getWinners())
            games.delete(roomCode)
            console.log(`Game over for room ${roomCode}`)
        }
    }, 100) // 100ms 간격으로 게임 상태를 업데이트
}

export function handleSocketConnection(socket: Socket, io: Server): void {
    socket.on('createRoom', () => {
        const roomCode = generateRoomCode()
        games.set(roomCode, new Game())
        socket.join(roomCode)
        socket.emit('roomCreated', roomCode)
        console.log(`Room created: ${roomCode}`)
    })

    socket.on('joinRoom', (roomCode: string) => {
        console.log(`User ${socket.id} joining room ${roomCode}`)
        if (games.has(roomCode)) {
            const game = games.get(roomCode)!
            socket.join(roomCode)
            game.addPlayer(socket.id)
            socket.emit('joinedRoom', roomCode)
            io.to(roomCode).emit('playerJoined', game.players.length)
            console.log(`Player ${socket.id} joined room: ${roomCode}`)
            console.log(
                `Current number of players in room ${roomCode}: ${io.sockets.adapter.rooms.get(roomCode)?.size}`
            )
        } else {
            socket.emit('roomNotFound')
        }
    })

    socket.on('startGame', (roomCode: string) => {
        if (games.has(roomCode)) {
            const game = games.get(roomCode)!
            const clients = io.sockets.adapter.rooms.get(roomCode)

            if (clients && clients.size >= 2) {
                // 방에 있는 모든 플레이어를 게임에 추가
                clients.forEach((clientId) => {
                    if (
                        !game.players.some((player) => player.id === clientId)
                    ) {
                        game.addPlayer(clientId)
                    }
                })

                // 초기 음식 생성
                game.generateFood()

                // 게임 시작 시 초기 상태 전송
                io.to(roomCode).emit('gameStarted', game.getState())
                console.log(`Game started event emitted to room: ${roomCode}`)
                console.log('Initial game state:', game.getState())

                // 게임 루프 시작
                startGameLoop(roomCode, io)
            } else {
                socket.emit('notEnoughPlayers')
                console.log(`Not enough players in room: ${roomCode}`)
            }
        } else {
            socket.emit('roomNotFound')
        }
    })

    socket.on('disconnect', () => {
        games.forEach((game, roomCode) => {
            game.removePlayer(socket.id)
            if (game.players.length === 0) {
                games.delete(roomCode)
            }
        })
    })
    socket.on('changeDirection', ({ roomCode, direction }) => {
        if (games.has(roomCode)) {
            const game = games.get(roomCode)!
            game.movePlayer(socket.id, direction)
            console.log(
                `Player ${socket.id} changed direction to ${direction} in room ${roomCode}`
            )
        }
    })
}
