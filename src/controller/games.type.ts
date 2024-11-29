import { Character } from 'game/objects/player'

export type GetGamePersonalSummaryRequest = {
    roomId: string
    userId: string
}

export type GetGamePersonalSummaryResponse = {
    character: Pick<Character, 'id' | 'charType' | 'charColor' | 'nickName'>
    badges: Array<{ label: string; img: string }>
    summary: Array<{ label: string; value: number }>
}

// export type GetGameTotalSummaryRequest = {}

// export type GetGameTotalSummaryResponse = {}
