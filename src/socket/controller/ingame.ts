import { BaseController } from './base'
import { OnEventData, OnEventName } from '../types/on'
import roomService, { Player } from '../../service/rooms'
import { TailTagMap } from '../../game/maps'
import { ItemType } from '../../game/objects/item'

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
        // console.log('[disconnect] ingame - 세션 유지')
    }

    // 이미 시작된 게임에 참여하는 플레이어를 처리
    joinStartedGame(
        gameSessionId: string,
        charType?: number,
        incomingPlayer?: Player
    ) {
        const userId = this.getUserId()
        const roomId = this.getRoomId()
        const room = roomService.findGameRoomById(roomId)

        if (!room) {
            console.error('게임방을 찾을 수 없습니다:', roomId)
            return
        }

        // 플레이어가 이미 게임에 있는지 확인
        const existingPlayer = room.players.find((p) => p.userId === userId)
        if (!existingPlayer) {
            console.log(
                `플레이어 ${userId}를 이미 시작된 게임에 추가: gameSessionId=${gameSessionId}`
            )

            // 플레이어를 게임에 추가 (incomingPlayer가 있으면 사용, 없으면 this.getPlayer() 사용)
            const player = incomingPlayer || this.getPlayer()
            console.log(`🔍 사용할 플레이어 정보:`, {
                userId: player.userId,
                nickName: player.nickName,
                accountId: player.accountId,
                isIncomingPlayer: !!incomingPlayer,
            })

            // accountId로 기존 플레이어 찾기 (매핑)
            console.log(
                `🔍 accountId 매핑 시도: player.accountId=${player.accountId}`
            )
            console.log(
                `🔍 현재 게임방 플레이어들:`,
                room.players.map((p) => ({
                    userId: p.userId,
                    nickName: p.nickName,
                    accountId: p.accountId,
                    teamNumber: p.teamNumber,
                }))
            )

            if (player.accountId) {
                const existingTempPlayer = room.players.find(
                    (p) => p.accountId === player.accountId
                )

                if (existingTempPlayer) {
                    console.log(`✅ 기존 임시 플레이어 발견:`, {
                        userId: existingTempPlayer.userId,
                        nickName: existingTempPlayer.nickName,
                        accountId: existingTempPlayer.accountId,
                        teamNumber: existingTempPlayer.teamNumber,
                    })

                    // 기존 임시 플레이어를 클라이언트 정보로 업데이트 (accountId는 유지)
                    existingTempPlayer.userId = player.userId
                    existingTempPlayer.nickName = player.nickName
                    existingTempPlayer.updateCharType(charType || 1)
                    // accountId는 원래 값 유지 (덮어쓰지 않음)

                    // gameMap의 캐릭터 정보도 업데이트
                    // 기존 임시 플레이어의 원래 userId로 gameMap에서 찾기
                    const originalUserId = existingTempPlayer.accountId
                        ? `User_${existingTempPlayer.accountId.slice(-8)}`
                        : existingTempPlayer.userId
                    const existingCharacter =
                        room.gameMap.findCharacter(originalUserId)

                    if (existingCharacter) {
                        existingCharacter.id = player.userId
                        existingCharacter.nickName = player.nickName
                        console.log(
                            `✅ gameMap 캐릭터 업데이트: ${originalUserId} -> ${player.userId}`
                        )
                    } else {
                        console.log(
                            `❌ gameMap에서 캐릭터를 찾을 수 없음: ${originalUserId}`
                        )
                    }

                    console.log(
                        `✅ 기존 임시 플레이어 매핑 완료: ${player.userId} (accountId=${player.accountId})`
                    )
                    return // 새로운 플레이어 추가하지 않음
                } else {
                    console.log(
                        `❌ accountId로 기존 플레이어를 찾을 수 없음: ${player.accountId}`
                    )
                }
            } else {
                console.log(`❌ player.accountId가 없음`)
            }

            // charType이 전달되었으면 설정, 아니면 기본값 사용
            if (charType !== undefined) {
                player.updateCharType(charType)
                console.log(
                    `플레이어 ${userId}의 charType을 설정: ${charType} (${charType === 1 ? 'RABBIT' : charType === 2 ? 'SANTA' : charType === 3 ? 'GHOST' : 'UNKNOWN'})`
                )
            } else if (!player.charType) {
                player.updateCharType(1) // RABBIT
                console.log(
                    `플레이어 ${userId}의 charType을 기본값으로 설정: RABBIT`
                )
            }

            room.addPlayer(player)

            // 게임맵에 캐릭터가 이미 있는지 확인
            const existingCharacter = room.gameMap.findCharacter(player.userId)
            if (!existingCharacter) {
                // 게임맵에 캐릭터 추가
                try {
                    room.gameMap.addCharacter({
                        id: player.userId,
                        nickName: player.nickName,
                        charType: player.charType,
                    })
                    console.log(
                        `✅ 게임맵에 캐릭터 추가 성공: userId=${player.userId}, charType=${player.charType}`
                    )
                } catch (error) {
                    console.error(
                        `❌ 게임맵에 캐릭터 추가 실패: userId=${player.userId}, charType=${player.charType}, error=${error.message}`
                    )
                }
            } else {
                console.log(
                    `이미 게임맵에 캐릭터가 존재: userId=${player.userId}`
                )
            }
        } else {
            // 기존 플레이어의 charType이 설정되지 않았으면 설정
            if (charType !== undefined && !existingPlayer.charType) {
                existingPlayer.updateCharType(charType)
                console.log(
                    `기존 플레이어 ${userId}의 charType을 설정: ${charType}`
                )
            } else if (!existingPlayer.charType) {
                existingPlayer.updateCharType(1) // RABBIT
                console.log(
                    `기존 플레이어 ${userId}의 charType을 기본값으로 설정: RABBIT`
                )
            }
        }
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
}

export default IngameController
