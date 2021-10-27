import { Button, ButtonProps } from '@material-ui/core';
import { useWallet } from '@solana/wallet-adapter-react';
import React, { FC, MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { WalletIcon } from './WalletIcon';

interface DisconnectButtonProps extends ButtonProps {
    theme: any;
}

export const WalletDisconnectButton: FC<DisconnectButtonProps> = ({
    color = 'primary',
    variant = 'contained',
    children,
    disabled,
    onClick,
    theme,
    ...props
}) => {
    const { wallet, disconnect, disconnecting } = useWallet();
    const primaryColor = theme === "light" ? "#49A1F2" : "#F8CC82";
    const [isHovering, setIsHovering] = useState(false);

    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        (event) => {
            if (onClick) onClick(event);
            if (!event.defaultPrevented)
                disconnect().catch(() => {
                });
        },
        [onClick, disconnect]
    );

    const content = useMemo(() => {
        if (children) return children;
        if (disconnecting) return 'Disconnecting ...';
        if (wallet) return 'Disconnect';
        return 'Disconnect Wallet';
    }, [children, disconnecting, wallet]);

    return (
        <Button
            className="pending-txn-container hovered-button"
            color={color}
            variant={variant}
            onClick={handleClick}
            disabled={disabled || !wallet}
            startIcon={<WalletIcon wallet={wallet} />}
            {...props}
        >
            {content}
        </Button>
    );
};
