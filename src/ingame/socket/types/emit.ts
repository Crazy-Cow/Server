import { Character } from '../../../game/objects/player'
import { RoomState } from '../../../service/rooms'

export type EmitEventName =
    | 'room.changeState' // 대기실 상태 변경
    | 'game.start' // 게임 시작
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
    'game.state': SocketEmitEvtDataGameState
    'game.over': undefined
}

export type EmitEventData = {
    [K in EmitEventName]: EmitEventDataMap[K]
}

export type SocketEmitEvtDataGameState = {
    remainRunningTime: number
    characters: {
        id: Character['id']
        nickName: Character['nickName']
        position: Character['position']
        bodyColor: Character['bodyColor']
        hairColor: Character['hairColor']
        bellyColor: Character['bellyColor']
        velocity: Character['velocity']
        hasTail: Character['hasTail']
    }[]
}
