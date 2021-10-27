import {
    Box,
    Button,
    Collapse,
    Modal,
    DialogProps,
    IconButton,
    List,
    ListItem,
    Fade
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletName } from '@solana/wallet-adapter-wallets';
import React, { FC, ReactElement, SyntheticEvent, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useWalletDialog } from './useWalletDialog';
import { WalletListItem } from './WalletListItem';

export interface WalletDialogProps extends Omit<DialogProps, 'title' | 'open'> {
    featuredWallets?: number;
    title?: ReactElement;
}

export const WalletDialog: FC<WalletDialogProps> = ({
    title = 'Select your wallet',
    featuredWallets = 3,
    onClose,
    ...props
}) => {
    const { wallet, wallets, select } = useWallet();
    const { open, setOpen } = useWalletDialog();
    const [expanded, setExpanded] = useState(false);

    const [featured, more] = useMemo(
        () => [wallets.slice(0, featuredWallets), wallets.slice(featuredWallets)],
        [wallets, featuredWallets]
    );

    const handleClose = useCallback(
        (event: SyntheticEvent, reason?: 'backdropClick' | 'escapeKeyDown') => {
            if (onClose) onClose(event, reason!);
            if (!event.defaultPrevented) setOpen(false);
        },
        [setOpen, onClose]
    );

    const handleWalletClick = useCallback(
        (event: SyntheticEvent, walletName: WalletName) => {
            select(walletName);
            handleClose(event);
        },
        [select, handleClose]
    );

    const handleExpandClick = useCallback(() => setExpanded(!expanded), [setExpanded, expanded]);

    return (
        <Modal open={open} onClose={handleClose} closeAfterTransition {...props}>
            <Fade in={open} timeout={300}>
                <StyledContainer>
                    <ModalHeader>
                        {title}
                        <IconButton onClick={handleClose}>
                            <CloseIcon />
                        </IconButton>
                    </ModalHeader>
                    <ModalBody>
                        <List>
                            {featured.map((x) => (
                                <WalletListItem
                                    key={x.name}
                                    onClick={(event) => handleWalletClick(event, x.name)}
                                    wallet={x}
                                    active={x === wallet}
                                />
                            ))}
                            {more.length ? (
                                <>
                                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                                        <List disablePadding>
                                            {more.map((wallet) => (
                                                <WalletListItem
                                                    key={wallet.name}
                                                    onClick={(event) => handleWalletClick(event, wallet.name)}
                                                    wallet={wallet}
                                                />
                                            ))}
                                        </List>
                                    </Collapse>
                                    <ListItem>
                                        <Button onClick={handleExpandClick}>
                                            {expanded ? 'Less' : 'More'}
                                            {expanded ? <ExpandLess /> : <ExpandMore />}
                                        </Button>
                                    </ListItem>
                                </>
                            ) : null}
                        </List>
                    </ModalBody>
                </StyledContainer>
            </Fade>
        </Modal>
    );
};

const ModalHeader = styled(Box)`
    font-size: 24px;
    padding-left: 24px;
    padding-right: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`

const ModalBody = styled(Box)`
`

const StyledContainer = styled(Box)`
    padding: 8px;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 5px;
    background: rgba(30,30,30);
    * {
        font-size: 16px;
        color: white;
    }
    min-width: 384px;
`