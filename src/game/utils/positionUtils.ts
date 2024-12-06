import { Character, Position } from '../objects/player'

const PREDEFINED_POSITIONS: Position[] = [
    { x: -4, y: 2, z: 4 },
    { x: 7, y: 2, z: -7 },
    { x: 14, y: 2, z: 12 },
    { x: 12, y: 2, z: 33 },
    { x: 36, y: 2, z: 20 },
    { x: 45, y: 2, z: -10 },
    { x: 8, y: 2, z: -30 },
    { x: -32, y: 2, z: -32 },
    { x: -40, y: 2, z: -1 },
    { x: -52, y: 2, z: 28 },
    { x: -17.3, y: 10, z: 2.85 },
    { x: -12, y: 2, z: 57 },
    { x: -1, y: 2, z: -64 },
    { x: -16, y: 2, z: 27 },
    { x: -31, y: 2, z: 22 },
]

const GROUND_POS = {
    x: 0,
    y: -1, // y축에서 바닥이 약간 아래로 설정됩니다.
    z: 0,
}

const MAX_GROUND = 88
const MAX_HEIGHT = 35
const MIN_HEIGHT = -10

function isValidXZPosition(position: Position): boolean {
    const pos = Math.sqrt(position.x ** 2 + position.z ** 2)
    return pos <= MAX_GROUND
}

function isValidYPosition(position: Position): boolean {
    return position.y <= MAX_HEIGHT && position.y >= MIN_HEIGHT
}

function repositionInMapBoundary(character: Character) {
    if (!isValidXZPosition(character.position)) {
        character.velocity = { x: 0, y: character.velocity.y, z: 0 }
        character.position = {
            x: character.position.x * 0.95,
            y: character.position.y,
            z: character.position.z * 0.95,
        }
    }
    if (!isValidYPosition(character.position)) {
        character.velocity.y = 0
        character.position = PREDEFINED_POSITIONS[0]
    }
}

export const mapPositon = {
    PREDEFINED_POSITIONS,
    GROUND_POS,
    MAX_GROUND,
    MAX_HEIGHT,
    MIN_HEIGHT,
    repositionInMapBoundary,
    isValidXZPosition,
}

export default mapPositon
