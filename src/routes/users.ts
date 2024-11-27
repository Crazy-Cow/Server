import express from 'express'
import * as ctrl from '../controller/users'

const router = express.Router()

router.get('/random-nickname', ctrl.getRandomNicknameController)

// (시작) will be deprecated ============
router.post('/enter', ctrl.createUserController)
// (끝) will be deprecated ============

router.post('/guest-in', ctrl.guestInUserController)
router.post('/sign-in', ctrl.signInUserController)
router.post('/sign-up', ctrl.signUpUserController)
router.post('/sign-out', ctrl.signOutUserController)

export default router
