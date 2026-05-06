import { Injectable } from "@angular/core";
import { BlockchainBlock } from "../../shared/models/p2p.models";
import { canonicalJson } from "../utils/canonical-json.util";
import { sha256Hex } from "../utils/sha256Hex.util";

@Injectable({
    providedIn: "root"
})
export class BlockchainVerificationService {
    async getLastBlockHash(blockchain: BlockchainBlock[]): Promise<string> {
        if (!Array.isArray(blockchain) || blockchain.length === 0) {
            throw new Error("La blockchain recibida está vacía");
        }

        await this.verifyBlockchain(blockchain);

        const lastBlock = blockchain[blockchain.length - 1];

        return lastBlock.hash;
    }

    async verifyBlockchain(blockchain: BlockchainBlock[]): Promise<void> {
        for (let i = 0; i < blockchain.length; i++) {
            const block = blockchain[i];

            const calculatedHash = await this.calculateBlockHash(block);

            if (calculatedHash !== block.hash) {
                throw new Error(`Hash inválido en el bloque ${i}`);
            }

            if (i === 0) {
                if (block.previousHash !== null) {
                    throw new Error("El bloque génesis debe tener previousHash null");
                }
            } else {
                const previousBlock = blockchain[i - 1];

                if (block.previousHash !== previousBlock.hash) {
                    throw new Error(`previousHash inválido en el bloque ${i}`);
                }
            }
        }
    }

    async calculateBlockHash(block: BlockchainBlock): Promise<string> {
        const blockWithoutHash = { ...block };
        delete (blockWithoutHash as any).hash;

        return sha256Hex(canonicalJson(blockWithoutHash));
    }
}