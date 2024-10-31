import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'

export interface CustomRequest extends Request {
    user_id: number
}

export const validateAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers['authorization']?.split(' ')[1]

    if (!token) {
        res.sendStatus(401)
        return
    }

    try {
        const user = verifyToken(token)
        ;(req as CustomRequest).user_id = user.id
        next()
    } catch (err) {
        res.sendStatus(403)
        return
    }
}
