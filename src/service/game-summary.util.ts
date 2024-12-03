import { BadgeItem } from 'controller/games.type'

type BadgeKey =
    | 'the-highest'
    | 'skill-lover'
    | 'item-boost'
    | 'item-thunder'
    | 'item-shield'
    | 'item-gift'
    | 'pink-princess'
    | 'fighting'

export const BADGES: Record<BadgeKey, BadgeItem> = {
    'the-highest': {
        label: '별따기 선수',
        img: 'https://github.com/user-attachments/assets/4b6897c6-ecb5-436e-96e1-7369ce734eaf',
    },
    'skill-lover': {
        label: '스킬 러버',
        img: 'https://github.com/user-attachments/assets/61d7be9b-859c-4137-a902-efac773ab253',
    },
    'item-boost': {
        label: '스피드 레이서',
        img: 'https://github.com/user-attachments/assets/5981cac1-393e-4c2e-94f3-e849ea60a4bf',
    },
    'item-thunder': {
        label: '토르',
        img: 'https://github.com/user-attachments/assets/c40b2ca4-3c94-4aef-bba4-e5e17391243e',
    },
    'item-shield': {
        label: '온실 속의 화초',
        img: 'https://github.com/user-attachments/assets/63e222a6-4d9b-4906-97f2-7019dc96449b',
    },
    'item-gift': {
        label: '누워서 떡먹기',
        img: 'https://github.com/user-attachments/assets/67c72fa1-6471-47b8-8631-fd62940588e1',
    },
    'pink-princess': {
        label: '핑크 공주',
        img: 'https://github.com/user-attachments/assets/b993b462-48bf-4808-9244-e9db299f93fd',
    },
    fighting: {
        label: '노력상',
        img: 'https://github.com/user-attachments/assets/f3c24c68-2d82-4601-be89-a12905cc1ab7',
    },
}
