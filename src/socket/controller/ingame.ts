import { BaseController } from './base'
import { OnEventData, OnEventName } from '../types/on'
import roomService, { Room } from '../../service/rooms'
import { updateInterval } from '../../game/maps/common'
import { TailTagMap } from '../../game/maps'
import { EmitEventData } from 'socket/types/emit'
import logMoveRepository from '../../db/redis/respository/log/move'
import { MoveLogProps } from '../../db/redis/respository/log/index.type'

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

    if (!character.isValidVelocity(data.character.velocity)) {
        character.position = {
            x: character.position.x + character.velocity.x * 1 * updateInterval,
            y: character.position.y + character.velocity.y * 1 * updateInterval,
            z: character.position.z + character.velocity.z * 1 * updateInterval,
        }
        return
    }
    character.steal = data.steal
    character.position = data.character.position
    character.velocity = data.character.velocity
    character.direction = character.getMovementDirection(character.velocity)
    if (data.skill) {
        character.isSkillInput = true
    }
}

class IngameController extends BaseController {
    logs: EmitEventData['game.state'][] = []
    logIdx = -1

    stopEmitLog() {
        return this.logs.length < this.logIdx
    }

    upAndGetLogIdx() {
        this.logIdx += 1
        return this.logIdx
    }

    async register() {
        // TODO this.gameMap이랑 연관
        this.socket.on<OnEventName>('move', this.handleMove)

        const mockRoomId = '1732859015109-5em4m9wkacq'
        const mockUserId = '아기자기한 도토리 7556'

        console.log(`[${Date.now()}] data load 중....`)
        const serializedLogs = await logMoveRepository.loadMove(
            mockRoomId,
            mockUserId
        )

        this.logs = serializedLogs.map((json) => {
            const log: MoveLogProps = JSON.parse(json)
            const data: MoveLogProps['data'] = log.data
            return data
        })

        console.log(`[${Date.now()}] data load 완료`)
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
            // input: data
            handleGameState: () => {
                const idx = this.upAndGetLogIdx()
                const data = this.logs[idx]
                if (!this.stopEmitLog()) {
                    this.broadcast(room.roomId, 'game.state', data)
                }

                //!: if(saveMode)
                // const timeStamp = Date.now()
                // logRepository.handleMove({
                //     roomId: room.roomId,
                //     userId: this.getUserId(),
                //     timeStamp,
                //     data,
                // })
            },
            handleGameOver: (data) => {
                console.log('게임 끝!')
                this.broadcast(room.roomId, 'game.over', data)
            },
        })
    }
}

export default IngameController
