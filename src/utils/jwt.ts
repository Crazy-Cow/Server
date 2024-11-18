import jwt from 'jsonwebtoken'
import { User } from '../service/users'

const JWT_SECRET = process.env.JWT_SECRET

type JwtPayload = {
    userId: string
    nickName: string
}

export const generateAccessToken = (user: User) => {
    const payload: JwtPayload = { userId: user.userId, nickName: user.nickName }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}

export const verifyToken = (token: string): JwtPayload => {
    return jwt.verify(token, JWT_SECRET)
}
