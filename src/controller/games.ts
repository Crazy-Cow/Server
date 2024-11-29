import { Response } from 'express'
import {
    GetGamePersonalSummaryRequest,
    GetGamePersonalSummaryResponse,
} from './games.type'
import { createError, ErrorResponse } from '../utils/error'
import gameSummaryService from '../service/game-summary'

export const getGamePersonalSummaryController = async (
    req,
    res: Response<GetGamePersonalSummaryResponse | ErrorResponse>
) => {
    const { roomId, userId } = req.query as GetGamePersonalSummaryRequest

    if (!roomId || !userId) {
        res.status(400).json(createError({ msg: '[roomId | userId] required' }))
        return
    }

    const summary = await gameSummaryService.getPersonalSummary(roomId, userId)
    if (!summary) {
        res.status(404).json(createError({ msg: 'no game data' }))
        return
    }
    const badges = await gameSummaryService.getPersonalBadges(roomId, userId)

    const response: GetGamePersonalSummaryResponse = {
        badges,
        summary,
    }

    res.json(response)
}

export const getGameTotalSummaryController = () => {
    return
}
