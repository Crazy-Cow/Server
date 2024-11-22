import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export const generateAccessToken = (user: { id: number; name: string }) => {
    return jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, {
        expiresIn: '1h',
    })
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET)
}
