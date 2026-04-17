import { VoterModel } from "../models/voter.model.js";

export async function findVoterByCredentials(voterId, secretCode) {
    return await VoterModel.findOne({ voterId, secretCode });
}

export async function findVoterById(voterId) {
    return await VoterModel.findOne({ voterId });
}

export async function updateVoterToken(voterId, token) {
    return await VoterModel.findOneAndUpdate({ voterId }, { $push: { token } });
}