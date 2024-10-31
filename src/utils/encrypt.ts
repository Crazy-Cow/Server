import bcrypt from 'bcrypt'

const SALT_ROUNDS = Number(process.env.ENCRYPT_SALT_ROUNDS)

export const encryptPassword = async (password) => {
    try {
        return await bcrypt.hash(password, SALT_ROUNDS)
    } catch (error) {
        throw new Error('[Error] encryptPassword')
    }
}

export const comparePasswords = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword)
    } catch (error) {
        throw new Error('[Error] comparePasswords')
    }
}
