import { Keypair } from '@solana/web3.js';

const keyPairJson = require('../contracts/helloworld-keypair.json');

export async function createKeypairFromFile() {
    const secretKey = Uint8Array.from(JSON.parse(JSON.stringify(keyPairJson)));
    return Keypair.fromSecretKey(secretKey);
}