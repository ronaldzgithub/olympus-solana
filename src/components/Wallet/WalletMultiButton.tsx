import {
    Button,
    ButtonProps,
    Collapse,
    Fade,
    ListItemIcon,
    makeStyles,
    Menu,
    MenuItem,
    Theme,
} from '@material-ui/core';
import CopyIcon from '@material-ui/icons/FileCopy';
import DisconnectIcon from '@material-ui/icons/LinkOff';
import SwitchIcon from '@material-ui/icons/SwapHoriz';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, TransactionSignature } from '@solana/web3.js';
import React, { FC, useMemo, useState, useCallback } from 'react';
import { useWalletDialog } from './useWalletDialog';
import { WalletConnectButton } from './WalletConnectButton';
import { WalletDialogButton } from './WalletDialogButton';
import { WalletIcon } from './WalletIcon';
import { useNotify } from './notify';

const useStyles = makeStyles((theme: Theme) => ({
    root: {},
    menu: {
        '& .MuiList-root': {
            padding: 0,
        },
        '& .MuiMenuItem-root': {
            padding: theme.spacing(1, 2),
            boxShadow: 'inset 0 1px 0 0 ' + 'rgba(255, 255, 255, 0.1)',
            '&:not(.MuiButtonBase-root)': {
                padding: 0,
                '& .MuiButton-root': {
                    borderRadius: 0,
                },
            },
            '&:hover': {
                boxShadow:
                    'inset 0 1px 0 0 ' + 'rgba(255, 255, 255, 0.1)' + ', 0 1px 0 0 ' + 'rgba(255, 255, 255, 0.05)',
            },
        },
        '& .MuiListItemIcon-root': {
            marginRight: theme.spacing(),
            minWidth: 'unset',
            '& .MuiSvgIcon-root': {
                width: 20,
                height: 20,
            },
        },
    },
}));

export const WalletMultiButton: FC<ButtonProps> = ({
    color = 'primary',
    variant = 'contained',
    children,
    ...props
}) => {
    const styles = useStyles();
    const { publicKey, wallet, disconnect } = useWallet();
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
    // const notify = useNotify();
    const handleAirdrop = async () => {
        if (!publicKey) {
            console.log('error', 'Wallet not connected!');
            return;
        }

        let signature: TransactionSignature = '';
        try {
            alert(LAMPORTS_PER_SOL)
            signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
            console.log('info', 'Airdrop requested:', signature);

            await connection.confirmTransaction(signature, 'processed');
            console.log('success', 'Airdrop successful!', signature);
        } catch (error: any) {
            console.log('error', `Airdrop failed! ${error?.message}`, signature);
        }
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
                className={styles.root}
                {...props}
            >
                {content}
            </Button>
            <Menu
                id="wallet-menu"
                anchorEl={anchor}
                open={!!anchor}
                onClose={() => setAnchor(undefined)}
                className={styles.menu}
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
                        className={styles.root}
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
                    <MenuItem onClick={handleAirdrop}>
                        Request airdrop
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
                </Collapse>
            </Menu>
        </>
    );
};
