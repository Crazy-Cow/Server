import { Position } from './player'

export enum ItemType {
    BOOST = 1,
    SHIELD = 2,
    THUNDER = 3,
    GIFT = 4,
}

export class Item {
    id: string
    type: ItemType
    position: Position

    constructor(id: string, type: ItemType, position: Position) {
        this.id = id
        this.type = type
        this.position = position
    }
}
