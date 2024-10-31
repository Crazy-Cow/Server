import { Router, Request, Response } from 'express'
import { UserSignInBody, UserSignUpBody } from './users.tpye'
import { validateField } from '../utils/validate'
import { comparePasswords, encryptPassword } from '../utils/encrypt'
import { repository } from '../db'
import { generateAccessToken } from '../utils/jwt'
import { createError } from '../utils/error'

const router = Router()

router.post(
    '/sign-in',
    async (
        req: Request<object, object, UserSignInBody>,
        res: Response
    ): Promise<void> => {
        const { nickname, password } = req.body

        const user = await repository.user.findOneBy({ name: nickname })
        if (!user) {
            res.status(400).json(
                createError({ msg: '닉네임 또는 패스워드를 확인해주세요.' })
            )
            return
        }

        const valid = await comparePasswords(password, user.hashed_pw)
        if (!valid) {
            res.status(400).json(
                createError({ msg: '닉네임 또는 패스워드를 확인해주세요.' })
            )
            return
        }

        const accessToken = generateAccessToken({
            id: user.id,
            name: user.name,
        })

        res.status(200).json({
            data: {
                accessToken,
                // TODO: refreshToken
            },
        })
    }
)

router.post(
    '/sign-up',
    async (
        req: Request<object, object, UserSignUpBody>,
        res: Response
    ): Promise<void> => {
        const { nickname, password, password_confirm } = req.body

        if (password !== password_confirm) {
            res.status(400).json(createError({ msg: '비밀번호/확인 불일치' }))
            return
        }

        const encrypted = await encryptPassword(password)

        const newUser = repository.user.create({
            name: nickname,
            hashed_pw: encrypted,
        })

        const nicknameValid = validateField('nickname', nickname)
        const passwordValid = validateField('password', {
            password: encrypted,
            nickname,
        })

        if (!nicknameValid.valid) {
            res.status(400).json(createError({ msg: nicknameValid.msg }))
            return
        }

        if (!passwordValid.valid) {
            res.status(400).json(createError({ msg: passwordValid.msg }))
            return
        }

        try {
            const existingUser = await repository.user.findOneBy({
                name: nickname,
            })
            if (existingUser) {
                res.status(409).json(
                    createError({ msg: '중복된 닉네임입니다' })
                )
                return
            }

            await repository.user.save(newUser)
            res.status(201).send({})
        } catch (e) {
            console.error(e)
            res.status(500).json(createError({ msg: '서버 오류' }))
        }
    }
)

export default router
