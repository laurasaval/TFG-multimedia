import { getVotingConfig } from "../../services/voting-config.service.js";

export const getVotingConfigController = async (req, res) => {
    try {
        const result = await getVotingConfig();

        if (!result.ok) {
            return res.status(404).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener la configuración de la votación"
        });
    }
}