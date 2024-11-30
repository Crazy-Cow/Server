const adjectives = [
    '신비로운',
    '깜찍한',
    '매혹적인',
    '상큼한',
    '말랑말랑한',
    '우아한',
    '귀염뽀짝한',
    '자유로운',
    '빛나는',
    '그윽한',
    '느끼한',
    '고독한',
    '촉촉한',
    '바삭한',
    '건조한',
    '몽환적인',
    '쫄깃한',
    '조용한',
    '아름다운',
    '다채로운',
    '무서운',
    '진지한',
    '유치한',
    '맨하튼',
    '전민동',
    '목이메는',
    'MZ',
    '맑은눈의',
]

const nouns = [
    '왕주먹',
    '물주먹',
    '핵주먹',
    '솜망치',
    '부장님',
    '과장님',
    '대리님',
    '사장님',
    '인턴',
    '코딩괴물',
    '주먹고기',
    '샐러드',
    '돈가스',
    '잼민이',
    '머머리',
    '김밥',
    '떡볶이',
    '라면',
    '붕어빵',
    '소떡소떡',
    '피자',
    '케이크',
    '초코',
    '햄버거',
    '치킨',
    '김치찌개',
    '쌀국수',
    '샐러드',
    '소시지',
    '파스타',
    '마카롱',
    '만두',
    '당면',
    '초밥',
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
