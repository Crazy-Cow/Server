export type GetRandomNickNameRequest = {
    userId: string
}

export type GetRandomNickNameResponse = {
    nickName: string
}

export type CreateUserRequest = {
    userId: string
    nickName: string
}

export type CreateUserResponse = {
    nickName: string
}
