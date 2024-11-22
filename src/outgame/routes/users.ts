import express from 'express'
import * as ctrl from '../controller/users'

const router = express.Router()

router.get('/random-nickname', ctrl.getRandomNicknameController)
router.post('/enter', ctrl.createUserController)

export default router
