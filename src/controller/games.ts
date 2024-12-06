import { Response } from 'express'
import {
    GetGameTotalRankSummaryRequest,
    GetGameTotalRankSummaryResponse,
} from './games.type'
import { createError, ErrorResponse } from '../utils/error'
import gameSummaryService from '../service/game-summary'

export const getGameTotalRankSummaryController = async (
    req,
    res: Response<GetGameTotalRankSummaryResponse | ErrorResponse>
) => {
    const { roomId } = req.query as GetGameTotalRankSummaryRequest

    if (!roomId) {
        res.status(400).json(createError({ msg: '[roomId] required' }))
        return
    }

    const result = await gameSummaryService.getTotalRankSummary(roomId)
    if (!result) {
        res.status(400).json(createError({ msg: 'no player data' }))
        return
    }

    res.json(result)
}
