import dotenv from "dotenv";
import { connectToDatabase, disconnectFromDatabase } from "../src/data/database.js";
import { VoterModel } from "../src/models/voter.model.js";
import { hashSecretCode } from "../src/crypto/hashing/argon2id.js";

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
    const hashedSecretCode = await hashSecretCode("123456");

    const voter = new VoterModel({
        voterId: `${country}-12345678`,
        secretCode: hashedSecretCode,
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