import { VoterModel } from "../models/voter.model.js";

export async function findVoterById(voterId) {
    return await VoterModel.findOne({ voterId });
}

export async function updateVoterAfterTokenCreation(voterId, encryptedToken, voterEncryptionPublicKey, voterSigningPublicKey) {
    return await VoterModel.findOneAndUpdate(
        { voterId },
        {
            $set: {
                encryptionPublicKey: voterEncryptionPublicKey,
                voterSigningPublicKey: voterSigningPublicKey,
                token: [encryptedToken]
            }
        },
        {
            returnDocument: "after"
        }
    );
}

export async function getVoterVotingPublicKeysById(voterId) {
    return await VoterModel.findOne(
        { voterId },
        {
            encryptionPublicKey: 1,
            voterSigningPublicKey: 1,
            _id: 0
        }
    );
}