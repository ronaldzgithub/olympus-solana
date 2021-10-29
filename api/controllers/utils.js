const os = require('os');
const fs = require('mz/fs');
const path = require('path');
const yaml = require('yaml');
const { Keypair } = require('@solana/web3.js');
/**
 * @private
 */
async function getConfig() {
    // Path to Solana CLI config file
    const CONFIG_FILE_PATH = path.resolve(
        os.homedir(),
        '.config',
        'solana',
        'cli',
        'config.yml',
    );
    const configYml = await fs.readFile(CONFIG_FILE_PATH, { encoding: 'utf8' });
    return yaml.parse(configYml);
}

/**
 * Load and parse the Solana CLI config file to determine which RPC url to use
 */
async function getRpcUrl() {
    try {
        const config = await getConfig();
        if (!config.json_rpc_url) throw new Error('Missing RPC URL');
        return config.json_rpc_url;
    } catch (err) {
        console.warn(
            'Failed to read RPC url from CLI config file, falling back to localhost',
        );
        return 'http://localhost:8899';
    }
}

/**
 * Load and parse the Solana CLI config file to determine which payer to use
 */
async function getPayer() {
    try {
        const config = await getConfig();
        if (!config.keypair_path) throw new Error('Missing keypair path');
        return await createKeypairFromFile(config.keypair_path);
    } catch (err) {
        console.warn(
            'Failed to create keypair from CLI config file, falling back to new random keypair',
        );
        return Keypair.generate();
    }
}

/**
 * Create a Keypair from a secret key stored in file as bytes' array
 */
async function createKeypairFromFile(
    filePath,
) {
    const secretKeyString = await fs.readFile(filePath, { encoding: 'utf8' });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    return Keypair.fromSecretKey(secretKey);
}

module.exports = {
    getRpcUrl,
    getPayer,
    createKeypairFromFile
}