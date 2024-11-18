import jwt from 'jsonwebtoken'
import { User } from '../service/users'

const JWT_SECRET = process.env.JWT_SECRET

export const generateAccessToken = (user: User) => {
    return jwt.sign(
        { userId: user.userId, nickName: user.nickName },
        JWT_SECRET,
        { expiresIn: '1h' }
    )
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET)
}
