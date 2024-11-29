export type GetGamePersonalSummaryRequest = {
    roomId: string
    userId: string
}

export type GetGamePersonalSummaryResponse = {
    badges: Array<{ img: string }>
    summary: Array<{
        label: string
        value: number
        img: string
    }>
}

// export type GetGameTotalSummaryRequest = {}

// export type GetGameTotalSummaryResponse = {}
