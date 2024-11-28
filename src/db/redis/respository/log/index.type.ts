export type LogCategory = 'event' | 'steal' | 'combo-steal'

export type CommonLogProps = {
    roomId: string
    timeStamp: number
}

export type StealLogProps = CommonLogProps & {
    actorId: string
    victimId: string
}

export type ComboStealLogProps = CommonLogProps & {
    // TODO
}
