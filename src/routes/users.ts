import express from 'express'
import * as ctrl from '../controller/users'

const router = express.Router()

router.post('/enter', ctrl.createUserController)

export default router
