import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

export const generateAccessToken = ({
    userId,
    nickName,
    isGuest,
    isTournament,
    challengermodeId,
}: {
    userId: string
    nickName: string
    isGuest: boolean
    isTournament?: boolean
    challengermodeId?: string
}) => {
    return jwt.sign(
        { userId, nickName, isGuest, isTournament, challengermodeId },
        JWT_SECRET,
        {
            expiresIn: '2h',
        }
    )
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET)
}
