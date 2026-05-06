import { randomUUID, createHash } from "crypto";
import { SIGNALING_TYPES, sendJson } from "./signaling-message-types.js";
import { canonicalJson } from "../../../shared/utils/canonical-json.util.js";

const ROUND_SIZE = Number(process.env.P2P_ROUND_SIZE || 2);

const waitingPeers = [];
const livePeersById = new Map();
const rounds = [];

let blockchain = [createGenesisBlock()];

function createGenesisBlock() {
    const blockBase = {
        index: 0,
        type: "GENESIS",
        previousHash: null,
        timestamp: new Date().toISOString(),
        data: {
            message: "Bloque génesis de la red P2P votación Eurovisión 2026"
        }
    };

    return {
        ...blockBase,
        hash: hashBlock(blockBase)
    }
}

function hashBlock(block) {
    const blockWithoutHash = { ...block };
    delete blockWithoutHash.hash;

    return createHash("sha256")
        .update(canonicalJson(blockWithoutHash))
        .digest("hex");
}

export function registerPeer({ ws, voterId }) {
    if (livePeersById.has(voterId)) {
        sendJson(ws, {
            type: SIGNALING_TYPES.ERROR,
            payload: {
                message: "Este votante ya está conectado a signaling"
            }
        });
        return;
    }

    // TODO: Solicitar e incluir clave de cifrado del peer

    const peer = {
        peerId: randomUUID(),
        voterId,
        joinedAt: new Date().toISOString(),
        ws,
        roundId: null
    };

    livePeersById.set(peer.peerId, peer);
    waitingPeers.push(peer);

    broadcastWaitingRoom();

    if (waitingPeers.length >= ROUND_SIZE) {
        createRound();
    }
}

export function unregisterPeerBySocket(ws) {
    let removedPeer = null;

    for (const [peerId, peer] of livePeersById.entries()) {
        if (peer.ws === ws) {
            removedPeer = peer;
            livePeersById.delete(peerId);
            break;
        }
    }

    if (!removedPeer) {
        return;
    }

    const waitingIndex = waitingPeers.findIndex(
        (peer) => peer.peerId === removedPeer.peerId
    );

    if (waitingIndex >= 0) {
        waitingPeers.splice(waitingIndex, 1);
        broadcastWaitingRoom();
    }

    if (removedPeer.roundId) {
        broadcastToRound(removedPeer.roundId, {
            type: SIGNALING_TYPES.PEER_DISCONNECTED,
            payload: {
                peerId: removedPeer.peerId
            }
        });
    }
}

function broadcastWaitingRoom() {
    const payload = {
        waitingCount: waitingPeers.length,
        requiredCount: ROUND_SIZE,
        peers: waitingPeers.map(toPublicPeer)
    };

    for (const peer of waitingPeers) {
        sendJson(peer.ws, {
            type: SIGNALING_TYPES.WAITING_ROOM_UPDATE,
            payload
        });
    }
}

function createRound() {
    const selectedPeers = waitingPeers.splice(0, ROUND_SIZE);
    const previousRound = rounds.at(-1) || null;

    const roundId = randomUUID();
    const roundNumber = rounds.length + 1;
    const publicPeers = selectedPeers.map(toPublicPeer);

    const round = {
        roundId,
        roundNumber,
        createdAt: new Date().toISOString(),
        peers: publicPeers,
        previousRoundPeers: previousRound ? previousRound.peers : [],
        blockchain
    };

    rounds.push(round);

    for (const peer of selectedPeers) {
        peer.roundId = roundId;

        sendJson(peer.ws, {
            type: SIGNALING_TYPES.ROUND_CREATED,
            payload: {
                roundId,
                roundNumber,
                ownPeerId: peer.peerId,
                peers: publicPeers,
                previousRoundPeers: round.previousRoundPeers,
                blockchain: round.blockchain,
                isFirstRound: roundNumber === 1
            }
        });
    }

    broadcastWaitingRoom();
}

export function relayToPeer({ fromPeerId, toPeerId, type, payload }) {
    const targetPeer = livePeersById.get(toPeerId);
    const sourcePeer = livePeersById.get(fromPeerId);

    if (!sourcePeer) {
        return;
    }

    if (!targetPeer) {
        sendJson(sourcePeer.ws, {
            type: SIGNALING_TYPES.ERROR,
            payload: {
                message: `Peer destino no encontrado: ${toPeerId}`
            }
        });
        return;
    }

    if (!sourcePeer.roundId || !targetPeer.roundId || sourcePeer.roundId !== targetPeer.roundId) {
        sendJson(sourcePeer.ws, {
            type: SIGNALING_TYPES.ERROR,
            payload: {
                message: "No puedes enviar mensajes a peers de otra ronda"
            }
        });
        return;
    }

    sendJson(targetPeer.ws, {
        type,
        payload: {
            ...payload,
            fromPeerId,
            toPeerId
        }
    });
}

function broadcastToRound(roundId, message) {
    for (const peer of livePeersById.values()) {
        if (peer.roundId === roundId) {
            sendJson(peer.ws, message);
        }
    }
}

function toPublicPeer(peer) {
    return {
        peerId: peer.peerId,
        joinedAt: peer.joinedAt
    };
}