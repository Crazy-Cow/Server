import { RoomState } from '../service/rooms'
import { Character, Position } from '../game/objects/player'

export type OnEventName =
    | 'connection' // 연결
    | 'disconnect' // 끊김
    | 'room.enter' // 빠른 시작
    | 'room.leave' // 대기실 나가기
    | 'move'

type ClientCharacter = {
    id: string
    position: Position
    velocity: Position
    isOnGround: boolean
}

type OnEventDataMap = {
    connection: undefined
    disconnect: undefined
    'room.enter': undefined
    'room.leave': undefined
    move: {
        // TODO: 시간정보 delta, datetime 정보 발생 시점
        shift: boolean
        character: ClientCharacter
    }
}

export type OnEventData = {
    [K in OnEventName]: OnEventDataMap[K]
}

export type EmitEventName =
    | 'room.changeState' // 대기실 상태 변경
    | 'game.start' // 게임 시작
    | 'characters' // v1 게임 상태
    | 'game.state' // v2 게임 상태
    | 'game.over' // 게임 종료

type EmitEventDataMap = {
    'room.changeState': {
        roomId: string
        state: RoomState
        playerCnt: number
        maxPlayerCnt: number
    }
    'game.start': undefined
    characters: SocketEmitEvtDataGameStateV1Item[]
    'game.state': SocketEmitEvtDataGameStateV2
    'game.over': undefined
}

export type EmitEventData = {
    [K in EmitEventName]: EmitEventDataMap[K]
}

// will be deprecated
export type SocketEmitEvtDataGameStateV1Item = {
    id: Character['id']
    position: Character['position']
    bodyColor: Character['bodyColor']
    hairColor: Character['hairColor']
    bellyColor: Character['bellyColor']
    velocity: Character['velocity']
    hasTail: Character['hasTail']
}

export type SocketEmitEvtDataGameStateV2 = {
    remainRunningTime: number
    characters: SocketEmitEvtDataGameStateV1Item[]
}
