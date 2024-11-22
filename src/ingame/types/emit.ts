import { Character } from '../game/objects/player'

// TODO: protocol 수정
export type EmitEventName =
    | 'ingame.start' // 게임 시작
    | 'ingame.state' // v2 게임 상태
    | 'ingame.over' // 게임 종료

type EmitEventDataMap = {
    'ingame.start': undefined
    'ingame.state': SocketEmitEvtDataGameState
    'ingame.over': undefined
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
