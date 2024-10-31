export interface UserSignUpBody {
    nickname: string
    password: string
    passwordConfirm: string
}

export interface UserSignInBody {
    nickname: string
    password: string
}
