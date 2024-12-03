import { BadgeItem } from 'controller/games.type'

type BadgeKey =
    | 'the-highest'
    | 'skill-lover'
    | 'item-boost'
    | 'item-thunder'
    | 'item-shield'
    | 'item-gift'
    | 'pink-princess'

export const BADGES: Record<BadgeKey, BadgeItem> = {
    'the-highest': { label: '별따기 선수', img: 'TODO' },
    'skill-lover': { label: '스킬 러버', img: 'TODO' },
    'item-boost': { label: '스피드 레이서', img: 'TODO' },
    'item-thunder': { label: '토르', img: 'TODO' },
    'item-shield': { label: '온실 속의 화초', img: 'TODO' },
    'item-gift': { label: '누워서 떡먹기', img: 'TODO' },
    'pink-princess': { label: '핑크 공주', img: 'TODO' },
}
