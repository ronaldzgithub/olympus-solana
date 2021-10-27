import { Button, ListItem, ListItemProps } from '@material-ui/core';
import { Wallet } from '@solana/wallet-adapter-wallets';
import React, { FC, MouseEventHandler } from 'react';
import styled from 'styled-components';
import { WalletIcon } from './WalletIcon';

interface WalletListItemProps extends Omit<ListItemProps, 'onClick' | 'button'> {
    onClick: MouseEventHandler<HTMLButtonElement>;
    wallet: Wallet;
    active?: boolean;
}

export const WalletListItem: FC<WalletListItemProps> = ({ onClick, wallet, active = false, ...props }) => {
    return (
        <StyledContainer active={active} {...props}>
            <Button onClick={onClick} endIcon={<WalletIcon wallet={wallet} />}>
                {wallet.name}
            </Button>
        </StyledContainer>
    );
};

const StyledContainer = styled(ListItem) <any>`
    >button {
        padding-left: 16px;
        padding-right: 16px;
        border-radius: 2px;
        border: 1px solid #434343;
        width: 100%;
        justify-content: space-between;
        * {
            transition: .3s;
        }
        &:hover {
            background: ${({ active }) => active ? '#00f8b7' : 'transparent'};
            * { color: ${({ active }) => active ? 'initial' : '#07a87e'} !important; }
            border-color: ${({ active }) => active ? 'initial' : '#07a87e'} !important;
        }
        &:active {
            * { color: #27e8ae !important; }
            border-color: #27e8ae !important;
        }
        ${({ active }) => active && 'background: #00f8b7; * { color: black; }'}
    }
`
