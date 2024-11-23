import { BaseController } from './base'
import { OnEventData, OnEventName } from '../types/on'
import roomService, { Room } from '../../service/rooms'
import { Character, Position } from '../../game/objects/player'
import userService from '../../service/users'

const MAX_SPEED = 10

function isValidVelocity(velocity: Position): boolean {
    const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2)
    return speed <= MAX_SPEED && velocity.y <= MAX_SPEED && velocity.y >= -35
}

function handleMove(character: Character, data: OnEventData['move']) {
    if (!isValidVelocity(data.character.velocity)) {
        console.warn(`Invalid velocity for character ${character.id}`)
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

    // disconnect() {
    //     this.gameMap?.removeCharacter(this.socket.id)
    // }

    private handleMove = (data: OnEventData['move']) => {
        const userId = this.getUserId()
        const player = userService.findUserById(userId)
        const room = roomService.findGameRoomById(player.roomId)
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
            handleGameOver: () => {
                console.log('게임 끝!')
                this.broadcast(room.roomId, 'game.over', undefined)
            },
        })
    }
}

export default IngameController
