import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export const generateAccessToken = (user: { id: number; nickName: string }) => {
    return jwt.sign({ id: user.id, nickName: user.nickName }, JWT_SECRET, {
        expiresIn: '24h',
    })
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET)
}
