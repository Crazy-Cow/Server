import bcrypt from 'bcrypt'

const SALT_ROUNDS = Number(process.env.ENCRYPT_SALT_ROUNDS)

export const encryptPassword = async (password) => {
    try {
        const result = await bcrypt.hash(password, SALT_ROUNDS)
        return result
    } catch (error) {
        throw new Error('[Error] encryptPassword')
    }
}

export const comparePasswords = async (password, hashedPassword) => {
    try {
        const result = await bcrypt.compare(password, hashedPassword)
        return result
    } catch (error) {
        throw new Error('[Error] comparePasswords')
    }
}
