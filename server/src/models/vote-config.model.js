import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
    countryCode: {
        type: String,
        required: true,
        uppercase: true,
        length: 2,
        unique: true
    },
    countryName: {
        type: String,
        required: true
    },
    performanceUrl: {
        type: String,
        required: false
    },
    performanceOrder: {
        type: Number,
        required: true
    },
    songTitle: {
        type: String,
        required: true
    },
    songTitleLang: {
        type: String,
        required: true
    },
    singer: {
        type: String,
        required: true
    },
    singerLang: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String,
        required: true
    },
    thumbnailAlt: {
        type: String,
        required: true
    }
}, {
    _id: false
});

const votingConfigSchema = new mongoose.Schema({
    editionCode: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    votingStart: {
        type: Date,
        required: true
    },
    votingEnd: {
        type: Date,
        required: true
    },
    candidates: {
        type: [candidateSchema],
        required: true,
        default: []
    }
}, {
    timestamps: true
});

export const VotingConfigModel = mongoose.model("VotingConfig", votingConfigSchema);