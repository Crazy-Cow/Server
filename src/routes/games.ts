import express from 'express'
import * as ctrl from '../controller/games'

const router = express.Router()

router.get('/summary/personal', ctrl.getGamePersonalSummaryController)
router.get('/summary/total', ctrl.getGameTotalSummaryController)

export default router
