import mongoose from "mongoose";
import { encryptedTokenSchema } from "./token.model.js";

const voterSchema = new mongoose.Schema({
    voterId: {
        type: String,
        required: true,
        unique: true
    },
    secretCode: {
        type: String,
        required: true
    },
    identityPublicKey: {
        type: String,
        required: true
    },
    voteSigningPublicKey: {
        type: String,
        required: false
    },
    encryptionPublicKey: {
        type: String,
        requiered: false
    },
    token: {
        type: [encryptedTokenSchema],
        default: [],
        required: false
    }
}, {
    timestamps: {
        createdAt: "registeredAt",
        updatedAt: "updatedAt"
    }
});

export const VoterModel = mongoose.model("Voter", voterSchema);