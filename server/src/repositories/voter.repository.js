import { VoterModel } from "../models/voter.model.js";

export async function findVoterById(voterId) {
    return await VoterModel.findOne({ voterId });
}

export async function updateVoterAfterTokenCreation(voterId, encryptedToken, voterEncryptionPublicKey, voteSigningPublicKey) {
    return await VoterModel.findOneAndUpdate(
        { voterId },
        {
            $set: {
                encryptionPublicKey: voterEncryptionPublicKey,
                voteSigningPublicKey: voteSigningPublicKey,
                token: [encryptedToken]
            }
        },
        {
            returnDocument: "after"
        }
    );
}