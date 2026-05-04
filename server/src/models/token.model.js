import mongoose from "mongoose";

const encryptedTokenSchema = new mongoose.Schema({
    encryptedKeyBase64: {
        type: String,
        required: true
    },
    ivBase64: {
        type: String,
        required: true
    },
    ciphertextBase64: {
        type: String,
        required: true
    }
}, { _id: false });

export const EncryptedTokenModel = mongoose.model("EncryptedToken", encryptedTokenSchema);
export { encryptedTokenSchema };