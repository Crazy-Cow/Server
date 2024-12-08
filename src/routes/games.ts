import express from 'express'
import * as ctrl from '../controller/games'

const router = express.Router()

router.get('/summary/total-rank', ctrl.getGameTotalRankSummaryController)

export default router
