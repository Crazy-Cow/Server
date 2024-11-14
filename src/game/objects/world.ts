import * as CANNON from 'cannon-es'
import { Character, Position } from './player'

export class GameWorld {
    world: CANNON.World
    characters: Character[] = []
    characterMaterial: CANNON.Material
    groundMaterial: CANNON.Material
    groundBody: CANNON.Body
    private readonly TAIL_STEAL_DISTANCE = 5

    constructor() {
        this.world = new CANNON.World()
        this.world.gravity.set(0, -9.82, 0)

        this.characterMaterial = new CANNON.Material('characterMaterial')
        this.groundMaterial = new CANNON.Material('groundMaterial')
        this.groundBody = this.createGround()
        this.world.addContactMaterial(
            new CANNON.ContactMaterial(
                this.characterMaterial,
                this.groundMaterial,
                { friction: 0.9, restitution: 0.0 }
            )
        )
    }

    createGround() {
        const ground = new CANNON.Body({
            mass: 0,
            material: this.groundMaterial,
        })
        ground.addShape(new CANNON.Box(new CANNON.Vec3(25, 1, 25)))
        ground.position.set(0, -1, 0)
        this.world.addBody(ground)
        return ground
    }

    addCharacter(character: Character) {
        this.characters.push(character)
        if (character.cannonBody) this.world.addBody(character.cannonBody)
    }

    removeCharacter(character: Character) {
        this.characters = this.characters.filter(
            (char) => char.id !== character.id
        )
        if (character.cannonBody) this.world.removeBody(character.cannonBody)
    }

    update() {
        this.world.step(1 / 60)
        this.characters.forEach((character) => {
            character.updatePosition()
            character.isBeingStolen = false
        })
    }

    handleCatch(character: Character) {
        if (character.hasTail) return

        for (const other of this.characters) {
            if (
                character.id !== other.id &&
                other.hasTail &&
                !other.isBeingStolen
            ) {
                const distance = this.calculateDistance(
                    character.position,
                    other.position
                )

                if (distance <= this.TAIL_STEAL_DISTANCE) {
                    other.isBeingStolen = true
                    character.hasTail = true
                    other.hasTail = false
                    console.log(
                        `${character.id} has stolen the tail from ${other.id}`
                    )
                    break
                }
            }
        }
    }

    private calculateDistance(pos1: Position, pos2: Position) {
        const dx = pos1[0] - pos2[0]
        const dz = pos1[2] - pos2[2]
        return Math.sqrt(dx * dx + dz * dz)
    }
}
