import { VoterModel } from "../models/voter.model.js";

export async function findVoterById(voterId) {
    return await VoterModel.findOne({ voterId });
}

export async function updateVoterAfterTokenCreation(voterId, encryptedToken, voterEncryptionPublicKey) {
    return await VoterModel.findOneAndUpdate(
        { voterId },
        {
            $set: {
                encryptionPublicKey: voterEncryptionPublicKey,
                token: [encryptedToken]
            }
        },
        {
            returnDocument: "after"
        }
    );
}