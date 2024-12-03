import { Response } from 'express'
import {
    GetGamePersonalSummaryRequest,
    GetGamePersonalSummaryResponse,
    GetGameTotalRankSummaryRequest,
    GetGameTotalRankSummaryResponse,
    GetGameTotalSummaryResponse,
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

    const player = gameSummaryService.getPlayerInfo(roomId, userId)
    if (!player) {
        res.status(400).json(createError({ msg: 'no player data' }))
        return
    }

    const summary = await gameSummaryService.getPersonalSummary(roomId, userId)
    if (!summary) {
        res.status(404).json(createError({ msg: 'no game data' }))
        return
    }
    const badges = await gameSummaryService.getPersonalBadges(roomId, userId)

    const response: GetGamePersonalSummaryResponse = {
        character: {
            id: player.id,
            nickName: player.nickName,
            charType: player.charType,
            charColor: player.charColor,
        },
        badges,
        summary,
    }

    res.json(response)
}

export const getGameTotalSummaryController = async (
    req,
    res: Response<GetGameTotalSummaryResponse | ErrorResponse>
) => {
    const { roomId } = req.query as GetGamePersonalSummaryRequest

    if (!roomId) {
        res.status(400).json(createError({ msg: '[roomId] required' }))
        return
    }

    const result = await gameSummaryService.getTotalSummary(roomId)
    if (!result) {
        res.status(400).json(createError({ msg: 'no player data' }))
        return
    }

    res.json(result)
}

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
