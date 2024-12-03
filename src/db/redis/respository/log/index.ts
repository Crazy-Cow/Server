import logComboStealRepository from './combo-steal'
import logStealRepository from './steal'

const logRepository = {
    handleSteal: logStealRepository.handleSteal,
    getLogAccSteal: logStealRepository.getLogAccSteal,
    getDoubleCombos: logComboStealRepository.getDoubleCombos,
    getTripleCombos: logComboStealRepository.getTripleCombos,
    getMultipleCombos: logComboStealRepository.getMultipleCombos,
}

export default logRepository
