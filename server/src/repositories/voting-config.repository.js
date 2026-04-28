import { VotingConfigModel } from "../models/vote-config.model.js";

export async function createVotingConfig(editionCode, title, votingStart, votingEnd, candidates) {
    const votingConfig = new VotingConfigModel({
        editionCode,
        title,
        votingStart,
        votingEnd,
        candidates
    });
    return await votingConfig.save();
}

export async function getCurrentVotingConfig(editionCode) {
    return await VotingConfigModel.findOne({ editionCode });
}

// Para facilitar el desarrollo, eliminamos todas las votaciones existentes.
// En un sistema real, esta llamada no existiría y solo existiría getCurrentVotingConfig
export async function deleteVotingConfig() {
    return await VotingConfigModel.deleteMany({});
}