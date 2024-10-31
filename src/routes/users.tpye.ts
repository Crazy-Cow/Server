export interface UserSignUpBody {
    nickname: string
    password: string
    password_confirm: string
}

export interface UserSignInBody {
    nickname: string
    password: string
}
