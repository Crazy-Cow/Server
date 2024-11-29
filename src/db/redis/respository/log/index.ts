import logComboStealRepository from './combo-steal'
import logMoveRepository from './move'
import logStealRepository from './steal'

const logRepository = {
    handleSteal: logStealRepository.handleSteal,
    getLogAccSteal: logStealRepository.getLogAccSteal,
    getDoubleCombos: logComboStealRepository.getDoubleCombos,
    getTripleCombos: logComboStealRepository.getTripleCombos,
    handleMove: logMoveRepository.handleMove,
}

export default logRepository
