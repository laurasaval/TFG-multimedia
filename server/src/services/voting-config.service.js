import { getCurrentVotingConfig } from "../repositories/voting-config.repository.js";

export async function getVotingConfig() {
    const editionCode = process.env.EDITION_CODE;

    if (!editionCode) {
        throw new Error("No hay edición activa");
    }

    const config = await getCurrentVotingConfig(editionCode);

    if (!config) {
        return {
            ok: false,
            message: "No existe ninguna votación configurada."
        }
    }

    return {
        ok: true,
        voting: {
            editionCode: config.editionCode,
            title: config.title,
            votingStart: config.votingStart,
            votingEnd: config.votingEnd,
            candidates: config.candidates
        }
    }
}