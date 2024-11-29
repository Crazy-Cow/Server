export type GetGamePersonalSummaryRequest = {
    roomId: string
    userId: string
}

export type GetGamePersonalSummaryResponse = {
    badges: Array<{ label: string; img: string }>
    summary: Array<{ label: string; value: number }>
}

// export type GetGameTotalSummaryRequest = {}

// export type GetGameTotalSummaryResponse = {}
