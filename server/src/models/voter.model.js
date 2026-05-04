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
    _id: false,
    timestamps: {
        createdAt: "registeredAt",
        updatedAt: "updatedAt"
    }
});

export const VoterModel = mongoose.model("Voter", voterSchema);