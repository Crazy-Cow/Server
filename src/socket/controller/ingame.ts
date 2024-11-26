import { BaseController } from './base'
import { OnEventData, OnEventName } from '../types/on'
import roomService2, { Room } from '../../service2/rooms'
import { Character, Position } from '../../game/objects/player'

const MAX_SPEED = 10

function isValidVelocity(velocity: Position): boolean {
    const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2)
    return speed <= MAX_SPEED && velocity.y <= MAX_SPEED && velocity.y >= -35
}

function handleMove(character: Character, data: OnEventData['move']) {
    if (!data) {
        console.error('data 없음', data)
    }

    if (!isValidVelocity(data.character.velocity)) {
        character.position = {
            x: character.position.x + (character.velocity.x * 1) / 60,
            y: character.position.y + (character.velocity.y * 1) / 60,
            z: character.position.z + (character.velocity.z * 1) / 60,
        }
        return
    }
    character.shift = data.shift
    character.position = data.character.position
    character.velocity = data.character.velocity
    character.isOnGround = data.character.isOnGround
}

class IngameController extends BaseController {
    register() {
        // TODO this.gameMap이랑 연관
        this.socket.on<OnEventName>('move', this.handleMove)
    }

    disconnect() {
        console.log('[disconnect] ingame - 세션 유지')
    }

    private handleMove = (data: OnEventData['move']) => {
        const userId = this.getUserId()
        const roomId = this.getRoomId()
        const room = roomService2.findGameRoomById(roomId)
        const gameMap = room?.gameMap
        if (gameMap) {
            const character = gameMap.findCharacter(userId)
            handleMove(character, data)
        } else {
            console.error('palyer가 게임 실행중이 아니에요')
        }
    }

    handleStartGame = (room: Room) => {
        room.loadGame()
        room.startGameLoop({
            handleGameState: (data) => {
                this.broadcast(room.roomId, 'game.state', data)
            },
            handleGameOver: (data) => {
                console.log('게임 끝!')
                this.broadcast(room.roomId, 'game.over', data)
            },
        })
    }
}

export default IngameController
