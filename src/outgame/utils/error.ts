import { Response } from 'express'
import StatusCode from '../constants/statusCode'

export interface ErrorResponse {
    msg: string
}

export const createError = ({ msg }: { msg: string }): ErrorResponse => {
    return { msg }
}

export const handleToCatchInternalServerError = (
    res: Response,
    err: ErrorResponse | Error
) => {
    let msg: string

    if ('msg' in err) {
        msg = err.msg
    } else {
        msg = err.message || 'UNKOWN ERROR'
    }

    // 에러 처리
    res.status(StatusCode.InternalServerError).json(
        createError({ msg: `[${msg}]\n잠시후 재시도해주세요` })
    )
}
