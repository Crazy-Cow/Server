type FieldValidator<T> = { condition: (args: T) => boolean; msg: string }
type FieldValidators<T> = FieldValidator<T>[]
const allowedFields = ['nickname', 'password'] as const
type Field = (typeof allowedFields)[number]

const createValidators =
    <T>(validators: FieldValidators<T>): (() => FieldValidators<T>) =>
    () =>
        validators

const nicknameValidators = createValidators<string>([
    {
        condition: (val) => val.length >= 3,
        msg: `'nickname' 3글자 이상 입력하세요`,
    },
    {
        condition: (val) => /^[a-zA-Z0-9]+$/.test(val),
        msg: `'nickname' (a-z, A-Z, 0-9)만 포함하세요`,
    },
])

const passwordValidators = createValidators<{
    password: string
    nickname: string
}>([
    {
        condition: ({ password }) => password.length >= 4,
        msg: `'password' 4글자 이상 입력하세요`,
    },
    {
        condition: ({ password, nickname }) => !password.includes(nickname),
        msg: `'password' 닉네임이 포함되면 안돼요`,
    },
])

const mapper = {
    nickname: nicknameValidators,
    password: passwordValidators,
} as const

function validateField<T extends Field>(
    field: T,
    args: T extends 'nickname' ? string : { password: string; nickname: string }
): {
    valid: boolean
    msg: string
} {
    let valid = true
    let msg = ''

    const validators = mapper[field]
    for (let i = 0; i < validators.length; i++) {
        const validator = validators[i]
        if (!validator.condition(args)) {
            valid = false
            msg = validator.msg
            break
        }
    }

    return { valid, msg }
}

export { validateField }
