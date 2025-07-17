import { CharacterType } from 'game/maps/common'
import { Position } from '../../game/objects/player'

export type OnEventName =
    | 'reconnect'
    | 'connection' // 연결
    | 'disconnect' // 끊김
    | 'room.enter' // 빠른 시작
    | 'room.launchGame' // KEM 게임 세션 시작
    | 'room.confirm' // 캐릭터 선택 완료
    | 'room.leave' // 대기실 나가기
    | 'move'
// | 'steal'
// | 'skill'

type OnEventDataMap = {
    reconnect: undefined
    connection: undefined
    disconnect: string // reason
    'room.enter': SocketOnEvtDataRoomEnter
    'room.launchGame': SocketOnEvtDataRoomLaunchGame
    'room.confirm': SocketOnEvtDataRoomConfirm
    'room.leave': undefined
    move: {
        steal: boolean
        skill: boolean
        item: boolean
        teleportAck: boolean
        character: {
            id: string
            position: Position
            velocity: Position
        }
    }
    // steal: { character: { steal: boolean } }
    // skill: { character: { skill: boolean } }
}

export type SocketOnEvtDataRoomEnter = {
    charType: CharacterType
    isKEM?: boolean // KEM 게임 여부
}

export type SocketOnEvtDataRoomLaunchGame = {
    charType: CharacterType
    gameSessionId: string // KEM 게임 세션 ID
    challengermodeId?: string // Challengermode 계정 ID
    challengermodeNickname?: string // Challengermode 닉네임
}

export type SocketOnEvtDataRoomConfirm = {
    userId: string // 클라이언트에서 받은 userId
    charType: CharacterType
    gameSessionId: string // KEM 게임 세션 ID
}

export type OnEventData = {
    [K in OnEventName]: OnEventDataMap[K]
}
