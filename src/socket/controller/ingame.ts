import { BaseController } from './base'
import { OnEventData, OnEventName } from '../types/on'
import roomService, { Room } from '../../service/rooms'
import { TailTagMap } from '../../game/maps'
import { ItemType } from '../../game/objects/item'

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
    // console.log(characterId, 'move') // load test
    if (!data) {
        console.error('data 없음', data)
    }
    const character = gameMap.findCharacter(characterId)

    if (data.teleportAck) {
        character.isAwaitingTeleportAck = false
    }

    if (character.isAwaitingTeleportAck) {
        return
    }

    if (data.steal) {
        gameMap.addStealQueue(characterId)
    }

    if (!character.isValidVelocity(data.character.velocity)) {
        const dataSpeed = Math.sqrt(
            data.character.velocity.x ** 2 + data.character.velocity.z ** 2
        )
        data.character.velocity = {
            x:
                (data.character.velocity.x / dataSpeed) *
                character.getMaxSpeed(),
            y: data.character.velocity.y,
            z:
                (data.character.velocity.z / dataSpeed) *
                character.getMaxSpeed(),
        }
    }
    character.steal = data.steal
    character.position = data.character.position
    character.velocity = data.character.velocity
    const newDirection = character.getMovementDirection(character.velocity)
    if (newDirection) {
        character.direction = newDirection
    }
    if (data.skill) {
        character.isSkillInput = true
    }
    if (data.item) {
        if (character.items[0] === ItemType.THUNDER) {
            gameMap.handleTunderItemUse(character)
        }
        character.useItem()
    }
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
        room.gameMap.registerSocket(this.getSocket())
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
