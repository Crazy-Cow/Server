import { RoomState } from '../../service/rooms'
import { Position } from '../../game/objects/player'

export type EmitEventName =
    | 'room.changeState' // 대기실 상태 변경
    | 'game.ready' // 게임 곧 시작
    | 'game.start' // 게임 시작
    | 'game.state' // v2 게임 상태
    | 'game.log.steal' // 로그 - 스틸
    | 'game.log.steal-combo' // 로그 - 스틸 콤보
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
    'game.log.steal-combo': SocketEmitEvtDataGameLogStealCombo
    'game.over': SocketEmitEvtDataGameOver
}

export type EmitEventData = {
    [K in EmitEventName]: EmitEventDataMap[K]
}

export type SocketEmitEvtDataGameOver = {
    winner: { nickName: string } // TODO: deprecated
    roomId: string
}

export type SocketEmitEvtDataGameState = {
    remainRunningTime: number
    characters: {
        id: string
        nickName: string
        charType: number
        position: Position
        charColor: string
        velocity: Position
        giftCnt: number
        stealMotion: boolean // punch 모션 출력용
        stolenMotion: boolean // duck 모션 출력용
        protectMotion: number // 0 이하면 해제 | 유저 무적상태 표시
        eventBlock: number // 0 이하면 해제 | 유저의 이벤트 입력을 차단
        isSkillActive: boolean // 스킬 활성화 상태
        totalSkillCooldown?: number // 전체 쿨 타임
        currentSkillCooldown?: number // 스킬의 남은 쿨타임
    }[]
}

export type SocketEmitEvtDataGameLogSteal = {
    actor: { id: string; nickName: string }
    victim: { id: string; nickName: string }
}

export type StealComboType = 'double' | 'triple'
export type SocketEmitEvtDataGameLogStealCombo = {
    actor: { id: string; nickName: string; combo: StealComboType }
}
