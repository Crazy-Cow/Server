import { RoomState } from '../../service/rooms'
import { Character } from '../../game/objects/player'

export type EmitEventName =
    | 'room.changeState' // 대기실 상태 변경
    | 'game.ready' // 게임 곧 시작
    | 'game.start' // 게임 시작
    | 'game.state' // v2 게임 상태
    | 'game.log.steal' // 로그 - 스틸
    | 'game.over' // 게임 종료

type EmitEventDataMap = {
    'room.changeState': {
        roomId: string
        state: RoomState
        playerCnt: number
        maxPlayerCnt: number
    }
    'game.ready': undefined
    'game.start': undefined
    'game.state': SocketEmitEvtDataGameState
    'game.log.steal': SocketEmitEvtDataGameLogSteal
    'game.over': SocketEmitEvtDataGameOver
}

export type EmitEventData = {
    [K in EmitEventName]: EmitEventDataMap[K]
}

export type SocketEmitEvtDataGameOver = {
    winner: { nickName: string }
}

export type SocketEmitEvtDataGameState = {
    remainRunningTime: number
    characters: {
        id: Character['id']
        nickName: Character['nickName']
        charType: Character['charType']
        position: Character['position']
        charColor: Character['charColor']
        velocity: Character['velocity']
        giftCnt: Character['giftCnt']
        steal: Character['steal']
        isBeingStolen: Character['isBeingStolen']
        skill: Character['skill']
        protect: Character['protect']
    }[]
}

export type SocketEmitEvtDataGameLogSteal = {
    actor: { id: string; nickName: string }
    victim: { id: string; nickName: string }
}
