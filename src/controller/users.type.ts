export type GetRandomNickNameResponse = {
    nickName: string
}

// (시작) will be deprecated ============
export type CreateUserRequest = {
    nickName: string
}

export type CreateUserResponse = {
    userId: string
}
// (끝) will be deprecated ============

export type GuestInRequest = {
    nickName: string
}

export type GuestInResponse = {
    accessToken: string
}

export type SignInRequest = {
    nickName: string
    password: string
}

export type SignInResponse = {
    accessToken: string
}

export type SignUpRequest = {
    nickName: string
    password: string
    passwordConfirm: string
}
