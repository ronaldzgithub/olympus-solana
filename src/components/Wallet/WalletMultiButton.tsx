import {
    Button,
    ButtonProps,
    Collapse,
    Fade,
    ListItemIcon,
    Menu,
    MenuItem,
} from '@material-ui/core';
import { useDispatch } from 'react-redux';
import CopyIcon from '@material-ui/icons/FileCopy';
import DisconnectIcon from '@material-ui/icons/LinkOff';
import SwitchIcon from '@material-ui/icons/SwapHoriz';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TransactionInstruction, sendAndConfirmTransaction, clusterApiUrl, Connection, LAMPORTS_PER_SOL, Keypair, SystemProgram, Transaction, TransactionSignature } from '@solana/web3.js';
import React, { FC, useMemo, useState } from 'react';
import { sign } from 'tweetnacl';
import bs58 from 'bs58';
import { useWalletDialog } from './useWalletDialog';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletDialogButton } from './WalletDialogButton';
import { WalletIcon } from './WalletIcon';
import { getSolanaBalance } from '../../slices/AccountSlice';

import { struct, u32, ns64 } from "@solana/buffer-layout";
import { Buffer } from 'buffer';

export const WalletMultiButton: FC<ButtonProps> = ({
    color = 'primary',
    variant = 'contained',
    children,
    ...props
}) => {
    const dispatch = useDispatch();
    const { publicKey, wallet, sendTransaction, signMessage, disconnect } = useWallet();
    const { setOpen } = useWalletDialog();
    const [anchor, setAnchor] = useState<HTMLElement>();

    const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
    const content = useMemo(() => {
        if (children) return children;
        if (!wallet || !base58) return null;
        return base58.slice(0, 4) + '..' + base58.slice(-4);
    }, [children, wallet, base58]);

    if (!wallet) {
        return (
            <WalletDialogButton color={color} variant={variant} {...props}>
                {children}
            </WalletDialogButton>
        );
    }
    if (!base58) {
        return (
            <WalletConnectButton color={color} variant={variant} {...props}>
                {children}
            </WalletConnectButton>
        );
    }

    const { connection } = useConnection();

    const handleAirdrop = async () => {
        setAnchor(undefined);
        if (!publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }

        let signature: TransactionSignature = '';
        try {
            signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
            console.log('info', 'Airdrop requested:', signature);

            await connection.confirmTransaction(signature, 'processed');
            const balance = await connection.getBalance(publicKey)
            dispatch(getSolanaBalance(balance + LAMPORTS_PER_SOL))
            console.log('success', 'Airdrop successful!', signature);
        } catch (error: any) {
            console.log('error', `Airdrop failed! ${error?.message}`, signature);
        }
    }

    const handleSendTransaction = async () => {
        setAnchor(undefined);
        if (!publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }

        let signature: TransactionSignature = '';
        try {
            console.log(SystemProgram.programId.toString())
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: Keypair.generate().publicKey,
                    programId: SystemProgram.programId,
                    lamports: LAMPORTS_PER_SOL,
                })
            );

            signature = await sendTransaction(transaction, connection);
            console.log('info', 'Transaction sent:', signature);

            await connection.confirmTransaction(signature, 'processed');
            const balance = await connection.getBalance(publicKey)
            dispatch(getSolanaBalance(balance - LAMPORTS_PER_SOL))
            console.log('success', 'Transaction successful!', signature);
        } catch (error: any) {
            console.log('error', `Transaction failed! ${error?.message}`, signature);
            return;
        }
    }

    const handleSignMessage = async () => {
        setAnchor(undefined);
        try {
            // `publicKey` will be null if the wallet isn't connected
            if (!publicKey) throw new Error('Wallet not connected!');
            // `signMessage` will be undefined if the wallet doesn't support it
            if (!signMessage) throw new Error('Wallet does not support message signing!');

            // Encode anything as bytes
            const message = new TextEncoder().encode('Hello, world!');
            // Sign the bytes using the wallet
            const signature = await signMessage(message);
            // Verify that the bytes were signed using the private key that matches the known public key
            if (!sign.detached.verify(message, signature, publicKey.toBytes())) throw new Error('Invalid signature!');

            console.log('success', `Message signature: ${bs58.encode(signature)}`);
        } catch (error: any) {
            console.log('error', `Signing failed: ${error?.message}`);
        }
    }

    const handleSendRustTransaction = async () => {
        setAnchor(undefined);
        if (!publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }
        let keypair = Keypair.generate();
        let payer = Keypair.generate();
        let connection = new Connection(clusterApiUrl('testnet'));

        let airdropSignature = await connection.requestAirdrop(
            publicKey,
            LAMPORTS_PER_SOL,
        );
        const ab = await connection.confirmTransaction(airdropSignature);
        console.log(ab)
        let allocateTransaction = new Transaction({
            feePayer: publicKey
        });
        let keys = [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }];
        let params = { space: 100 };

        let allocateStruct = {
            index: 8,
            layout: struct([
                u32('instruction'),
                ns64('space'),
            ])
        };

        let data = Buffer.alloc(allocateStruct.layout.span);
        let layoutFields = Object.assign({ instruction: allocateStruct.index }, params);
        allocateStruct.layout.encode(layoutFields, data);

        allocateTransaction.add(new TransactionInstruction({
            keys,
            programId: SystemProgram.programId,
            data,
        }));

        await sendAndConfirmTransaction(connection, allocateTransaction, [payer, keypair]);
    }

    return (
        <>
            <Button
                color={color}
                variant={variant}
                startIcon={<WalletIcon wallet={wallet} />}
                onClick={(event) => setAnchor(event.currentTarget)}
                aria-controls="wallet-menu"
                aria-haspopup="true"
                {...props}
            >
                {content}
            </Button>
            <Menu
                id="wallet-menu"
                anchorEl={anchor}
                open={!!anchor}
                onClose={() => setAnchor(undefined)}
                marginThreshold={0}
                TransitionComponent={Fade}
                transitionDuration={250}
                keepMounted
            >
                <MenuItem onClick={() => setAnchor(undefined)} button={false}>
                    <Button
                        color={color}
                        variant={variant}
                        startIcon={<WalletIcon wallet={wallet} />}
                        onClick={(event) => setAnchor(undefined)}
                        fullWidth
                        {...props}
                    >
                        {wallet.name}
                    </Button>
                </MenuItem>
                <Collapse in={!!anchor}>
                    <MenuItem
                        onClick={async () => {
                            setAnchor(undefined);
                            await navigator.clipboard.writeText(base58);
                        }}
                    >
                        <ListItemIcon>
                            <CopyIcon />
                        </ListItemIcon>
                        Copy address
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            setAnchor(undefined);
                            setOpen(true);
                        }}
                    >
                        <ListItemIcon>
                            <SwitchIcon />
                        </ListItemIcon>
                        Connect a different wallet
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            setAnchor(undefined);
                            disconnect().catch(() => {
                            });
                        }}
                    >
                        <ListItemIcon>
                            <DisconnectIcon />
                        </ListItemIcon>
                        Disconnect
                    </MenuItem>
                    <MenuItem onClick={handleAirdrop}>
                        Request airdrop
                    </MenuItem>
                    <MenuItem onClick={() => handleSendTransaction()}>
                        Send transaction
                    </MenuItem>
                    <MenuItem onClick={() => handleSendRustTransaction()}>
                        Send transaction(RUST)
                    </MenuItem>
                    <MenuItem onClick={handleSignMessage}>
                        Sign message
                    </MenuItem>
                </Collapse>
            </Menu>
        </>
    );
};
