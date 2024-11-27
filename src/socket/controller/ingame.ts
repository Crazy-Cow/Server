import { BaseController } from './base'
import { OnEventData, OnEventName } from '../types/on'
import roomService, { Room } from '../../service/rooms'
import { Position } from '../../game/objects/player'
import { updateInterval } from '../../game/maps/common'
import { TailTagMap } from '../../game/maps'

const MAX_SPEED = 10

function isValidVelocity(velocity: Position): boolean {
    const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2)
    return speed <= MAX_SPEED && velocity.y <= MAX_SPEED && velocity.y >= -40
}

// function handleSteal(character: Character, data: OnEventData['steal']) {
//     character.steal = data.character.steal
// }

// function handleSkill(character: Character, data: OnEventData['skill']) {
//     character.skill = data.character.skill
// }

function handleMove(
    characterId: string,
    gameMap: TailTagMap,
    data: OnEventData['move']
) {
    if (!data) {
        console.error('data 없음', data)
    }
    const character = gameMap.findCharacter(characterId)

    if (data.steal) {
        gameMap.addStealQueue(characterId)
    }

    if (!isValidVelocity(data.character.velocity)) {
        character.position = {
            x: character.position.x + character.velocity.x * 1 * updateInterval,
            y: character.position.y + character.velocity.y * 1 * updateInterval,
            z: character.position.z + character.velocity.z * 1 * updateInterval,
        }
        return
    }
    character.steal = data.steal
    character.skill = data.skill
    character.position = data.character.position
    character.velocity = data.character.velocity
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
        const room = roomService.findGameRoomById(roomId)
        const gameMap = room?.gameMap
        if (gameMap) {
            handleMove(userId, gameMap, data)
        } else {
            console.error('palyer가 게임 실행중이 아니에요')
        }
    }

    handleStartGame = (room: Room) => {
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
