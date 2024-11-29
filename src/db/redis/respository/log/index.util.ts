import { LogCategory } from './index.type'

export const createError = (method: string, err: unknown) => {
    return new Error(`[REDIS][LOG] ${method} failed\n${err}`)
}

type CreateCategoryKeyProps = {
    roomId: string
    category: LogCategory
}

/**
 * @description game:${roomId}:${category}
 */
export const getLogGRCKey = (props: CreateCategoryKeyProps) =>
    `game:${props.roomId}:${props.category}`

/**
 * @description game:${roomId}:${category}:${userId}
 */
export const getLogGRCUKey = (
    props: CreateCategoryKeyProps & { userId: string }
) => `${getLogGRCKey(props)}:${props.userId}`
