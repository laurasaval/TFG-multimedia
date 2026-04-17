import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
    tokenId: {
        type: String,
        required: true,
        unique: true
    },
    token: {
        type: String,
        required: true
    },
    voterPublicKey: {
        type: String,
        required: true
    },
    anccSignature: {
        type: String,
        required: true
    },
    issuedAt: {
        type: Date,
        default: Date.now
    },
    used: {
        type: Boolean,
        default: false
    }
});

export const TokenModel = mongoose.model("Token", tokenSchema);
export { tokenSchema };