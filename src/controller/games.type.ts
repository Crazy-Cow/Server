import { Character } from 'game/objects/player'

export type GetGameTotalRankSummaryRequest = {
    roomId: string
}

export type RankColumnItem = {
    field:
        | 'rank'
        | 'charcterType'
        | 'charcterColor'
        | 'nickName'
        | 'badges'
        | 'gifts'
        | 'multipleCombos'
        | 'tripleCombos'
        | 'doubleCombos'
        | 'accSteals'
        | 'userId'
    headerName: string
    textAlign: 'left' | 'center' | 'right'
}

export type BadgeItem = { label: string; img: string }

type FieldValues = {
    userId: string
    rank: number
    charcterType: Character['charType']
    charcterColor: Character['charColor']
    badges: Array<BadgeItem>
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
