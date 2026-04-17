import { findVoterByCredentials } from "../repositories/voter.repository.js";

export async function authenticateVoter(voterId, secretCode) {
    const voter = await findVoterByCredentials(voterId, secretCode);

    if (!voter) {
        return {
            ok: false,
            message: 'Credenciales incorrectas'
        };
    }
    return {
        ok: true,
        voter: voter
    };
}
