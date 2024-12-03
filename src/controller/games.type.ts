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

// (시작) deprecated
export type GetGameTotalSummaryRequest = {
    roomId: string
}

export type GetGameTotalSummaryResponse = {
    character: Pick<Character, 'id' | 'charType' | 'charColor' | 'nickName'>
    summary: Array<{ label: string; value: number }>
}
// (끝) deprecated

export type GetGameTotalRankSummaryRequest = {
    roomId: string
}

export type RankColumnItem = {
    field:
        | 'rank'
        | 'charcterType'
        | 'nickName'
        | 'badges'
        | 'gifts'
        | 'multipleCombos'
        | 'tripleCombos'
        | 'doubleCombos'
        | 'accSteals'
    headerName: string
    textAlign: 'left' | 'center' | 'right'
}

type FieldValues = {
    rank: number
    charcterType: Character['charType']
    badges: Array<{ label: string; img: string }>
    nickName: string
    gifts: number
    multipleCombos: number
    tripleCombos: number
    doubleCombos: number
    accSteals: number
}

export type RankRowItem = { userId: string } & {
    [K in RankColumnItem['field']]: FieldValues[K]
}

export type GetGameTotalRankSummaryResponse = {
    columns: RankColumnItem[]
    rows: RankRowItem[]
}
