import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { connectToDatabase, disconnectFromDatabase } from "../src/data/database.js";
import { createVotingConfig, deleteVotingConfig } from "../src/repositories/voting-config.repository.js";

const country = process.argv[2];

if (!country) {
    console.error("Error: Debes especificar el país");
    process.exit(1);
}

const result = dotenv.config({ path: `./env/.${country}.env` });

if (result.error) {
    console.error(`Error al cargar el archivo .${country}.env:`, result.error);
    process.exit(1);
}

function getEditonConfigPath() {
    return path.join(process.cwd(), "edition-config", `${process.env.EDITION_CODE}.json`);
}

async function createVoting() {
    try {
        await connectToDatabase(String(process.env.DATABASE_URI));

        const configPath = getEditonConfigPath();

        if (!fs.existsSync(configPath)) {
            throw new Error(`No existe el archivo de configuración: ${configPath}`);
        }

        const editionConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

        const candidatesWithoutOwnCountry = editionConfig.candidates.filter(
            (candidate) => candidate.countryCode !== process.env.COUNTRY_CODE
        );

        await deleteVotingConfig();

        await createVotingConfig(
            editionConfig.editionCode,
            editionConfig.title,
            editionConfig.votingStart,
            editionConfig.votingEnd,
            candidatesWithoutOwnCountry
        );

        console.log(`Votación creada exitosamente para el país: ${process.env.COUNTRY_CODE} - ${process.env.COUNTRY_NAME}`);
        process.exit(0);
    } catch (error) {
        console.error("Error al crear la votación:", error);
        process.exit(1);
    } finally {
        await disconnectFromDatabase();
    }
}

createVoting();