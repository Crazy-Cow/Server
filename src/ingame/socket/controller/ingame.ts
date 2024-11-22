import { BaseController } from './base'
import { OnEventData, OnEventName } from '../types/on'
import roomService, { Room } from '../../../service/rooms'
import { Character } from '../../../game/objects/player'
import userService from '../../../service/users'

function handleMove(character: Character, data: OnEventData['move']) {
    character.shift = data.shift
    character.position = data.character.position
    character.velocity = data.character.velocity
    character.isOnGround = data.character.isOnGround
}

class IngameController extends BaseController {
    // constructor(props: { socket: Socket }) {
    //     super(props)

    //     // TODO: load players from roomId
    //     // TODO: handleStartGame
    // }

    register() {
        // TODO this.gameMap이랑 연관
        this.socket.on<OnEventName>('move', this.handleMove)
    }

    // disconnect() {
    //     this.gameMap?.removeCharacter(this.socket.id)
    // }

    private handleMove = async (data: OnEventData['move']) => {
        const userId = this.getUserId()
        const player = await userService.findUserById(userId)

        // TODO: 현재 mock room
        const room = await roomService.findGameRoomById(player.roomId)
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
