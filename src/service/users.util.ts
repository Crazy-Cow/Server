const adjectives = [
    '귀여운',
    '사랑스러운',
    '작은',
    '반짝이는',
    '부드러운',
    '아기자기한',
    '행복한',
    '예쁜',
    '포근한',
]
const nouns = [
    '도토리',
    '토끼',
    '곰돌이',
    '별',
    '구름',
    '무지개',
    '펭귄',
    '고양이',
    '하트',
]

const generateGuestNickName = (): string => {
    // 무작위로 형용사와 명사 선택
    const randomAdjective =
        adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]

    // 랜덤한 4자리 숫자 생성
    const randomFourDigits = Math.floor(1000 + Math.random() * 9000)

    // 최종 닉네임 반환
    return `${randomAdjective} ${randomNoun} ${randomFourDigits}`
}

export default { generateGuestNickName }
