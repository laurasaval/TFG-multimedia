import dotenv from "dotenv";
import { connectToDatabase, disconnectFromDatabase } from "../src/data/database.js";
import { VoterModel } from "../src/models/voter.model.js";

const country = process.argv[2];

if (!country) {
    console.error('Por favor, introduce el código del país');
    process.exit(1);
}

const result = dotenv.config({ path: `./env/.${country}.env` });

if (result.error) {
    console.error(`Error al cargar el archivo .${country}.env:`, result.error);
    process.exit(1);
}

async function createVoter() {
    await connectToDatabase(String(process.env.DATABASE_URI));
    const voter = new VoterModel({
        voterId: `${country}-12345678`,
        secretCode: "123456",
        identityPublicKey: "12345678",
        token: []
    });
    await voter.save();
    console.log("Votante creado exitosamente");
    await disconnectFromDatabase();
    process.exit(0);
}

createVoter().catch((error) => {
    console.error('Error al crear al votante:', error);
    process.exit(1);
});