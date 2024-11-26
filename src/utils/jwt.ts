import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export const generateAccessToken = ({
    userId,
    nickName,
    isGuest,
}: {
    userId: string
    nickName: string
    isGuest: boolean
}) => {
    return jwt.sign({ userId, nickName, isGuest }, JWT_SECRET, {
        expiresIn: '24h',
    })
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET)
}
