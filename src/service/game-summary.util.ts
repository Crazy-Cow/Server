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
        label: '천상의 점프왕',
        img: 'https://res.cloudinary.com/dkjk8h8zd/image/upload/v1733284079/itemHighest_yfeqgw.webp',
    },
    'skill-lover': {
        label: '스킬 마스터',
        img: 'https://res.cloudinary.com/dkjk8h8zd/image/upload/v1733284078/skillItem_hzy5qp.webp',
    },
    'item-boost': {
        label: '스피드 레이서',
        img: 'https://res.cloudinary.com/dkjk8h8zd/image/upload/v1733284077/speedItem_iianwu.webp',
    },
    'item-thunder': {
        label: '토르',
        img: 'https://res.cloudinary.com/dkjk8h8zd/image/upload/v1733284079/thunderItem_wlktbu.webp',
    },
    'item-shield': {
        label: '온실속의 화초',
        img: 'https://res.cloudinary.com/dkjk8h8zd/image/upload/v1733284078/shieldItem_t7bf9l.webp',
    },
    'item-gift': {
        label: '누워서 선물먹기',
        img: 'https://res.cloudinary.com/dkjk8h8zd/image/upload/v1733284679/easypeasy_afilpq.webp',
    },
    'pink-princess': {
        label: '어쩌다보니 핑크공쥬',
        img: 'https://res.cloudinary.com/dkjk8h8zd/image/upload/v1733284078/pinkPrincess_muzrel.webp',
    },
    fighting: {
        label: '선물 도둑.. 인줄 알았는데',
        img: 'https://res.cloudinary.com/dkjk8h8zd/image/upload/v1733284079/effort_fo7dix.webp',
    },
}
