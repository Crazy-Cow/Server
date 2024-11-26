import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export const generateAccessToken = (user: {
    userId: number
    nickName: string
}) => {
    return jwt.sign(
        { userId: user.userId, nickName: user.nickName },
        JWT_SECRET,
        { expiresIn: '24h' }
    )
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET)
}
