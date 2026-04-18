import { findVoterById } from "../repositories/voter.repository.js";
import { verifySecretCode } from "../crypto/hashing/argon2id.js";

export async function authenticateVoter(voterId, secretCode) {
    const voter = await findVoterById(voterId);

    if (!voter) {
        return {
            ok: false,
            message: 'Credenciales incorrectas'
        };
    }

    const isSecretCodeValid = await verifySecretCode(voter.secretCode, secretCode);

    if (!isSecretCodeValid) {
        return {
            ok: false,
            message: 'Credenciales incorrectas'
        };
    }

    return {
        ok: true,
        voter: {
            voterId: voter.voterId,
            identityPublicKey: voter.identityPublicKey,
            token: voter.token
        }
    };
}
