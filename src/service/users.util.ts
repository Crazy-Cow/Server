export const generateGuestNickName = (): string => {
    const randomFourDigits = Math.floor(1000 + Math.random() * 9000)
    return `GUEST-${randomFourDigits}`
}
