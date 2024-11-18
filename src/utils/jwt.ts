import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export const generateAccessToken = (user: { nickName: string }) => {
    return jwt.sign({ nickName: user.nickName }, JWT_SECRET, {
        expiresIn: '1h',
    })
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET)
}
