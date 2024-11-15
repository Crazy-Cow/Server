import * as CANNON from 'cannon-es'
import { Character, Position } from '../objects/player'

export class CommonMap {
    updateInterval: number
    world: CANNON.World
    characters: Character[] = []
    characterMaterial: CANNON.Material
    groundMaterial: CANNON.Material

    constructor() {
        this.updateInterval = 1 / 60 // 60 FPS
        this.world = new CANNON.World()
        this.characterMaterial = new CANNON.Material('characterMaterial')
        this.groundMaterial = new CANNON.Material('groundMaterial')

        this.initWorld()
    }

    private initWorld() {
        this.world.gravity.set(0, -9.82, 0)
        this.createGround()
        this.setCollision()
    }

    private setCollision() {
        this.world.addContactMaterial(
            new CANNON.ContactMaterial(
                this.characterMaterial,
                this.groundMaterial,
                { friction: 0.9, restitution: 0.0 }
            )
        )
    }

    private createGround() {
        const groundBody = new CANNON.Body({
            mass: 0,
            material: this.groundMaterial,
            shape: new CANNON.Box(new CANNON.Vec3(25, 1, 25)),
            position: new CANNON.Vec3(0, -1, 0),
        })

        this.world.addBody(groundBody)
        return groundBody
    }

    private generateRandomPosition(): Position {
        return [Math.random() * 10, 2, Math.random() * 10]
    }

    addCharacter(id: string) {
        const position = this.generateRandomPosition()
        const character = new Character(id, position, this.characterMaterial)

        this.characters.push(character)
        if (character.cannonBody) this.world.addBody(character.cannonBody)
    }

    removeCharacter(character: Character) {
        this.characters = this.characters.filter(
            (char) => char.id !== character.id
        )
        if (character.cannonBody) this.world.removeBody(character.cannonBody)
    }

    convertGametate() {
        return this.characters.map((char) => ({
            id: char.id,
            position: char.position,
            bodyColor: char.bodyColor,
            hairColor: char.hairColor,
            bellyColor: char.bellyColor,
            hasTail: char.hasTail,
            facingAngleRad: char.facingAngleRad,
        }))
    }

    updateGameState() {
        this.world.step(this.updateInterval)

        this.characters.forEach((character) => {
            character.updatePosition()
            character.isBeingStolen = false
        })
    }
}
