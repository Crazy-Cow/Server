interface ErrorResponse {
    msg: string
}

export const createError = ({ msg }: { msg: string }): ErrorResponse => {
    return { msg }
}
