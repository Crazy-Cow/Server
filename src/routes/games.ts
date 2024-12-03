import express from 'express'
import * as ctrl from '../controller/games'

const router = express.Router()

router.get('/summary/personal', ctrl.getGamePersonalSummaryController)
router.get('/summary/total', ctrl.getGameTotalSummaryController) // deprecated
router.get('/summary/total-rank', ctrl.getGameTotalRankSummaryController)

export default router
