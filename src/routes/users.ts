import express from 'express'
import * as ctrl from '../controller/users'

const router = express.Router()

router.get('/random-nickname', ctrl.getRandomNicknameController)

// (시작) userId -> token 모드로 바뀌면 삭제 예정 ============
router.post('/enter', ctrl.createUserController)
// (끝) will be deprecated ============
// users.router.ts에 추가

router.post('/enter/tournament', ctrl.tournamentInUserController)
router.post('/guest-in', ctrl.guestInUserController)
router.post('/sign-out', ctrl.signOutUserController)
router.post('/verify-game-account', ctrl.verifyGameAccountController)

export default router
