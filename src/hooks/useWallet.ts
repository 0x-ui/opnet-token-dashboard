import { useState, useCallback } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';

/**
 * Hook for wallet connection and management.
 * Provides methods for connecting, disconnecting, and signing with OPNet-compatible wallets.
 *
 * @returns Wallet state and action methods
 */
export function useWallet() {
    const walletConnect = useWalletConnect();
    const [error, setError] = useState<Error | null>(null);

    /**
     * Open the wallet connection modal.
     */
    const openConnectModal = useCallback(() => {
        setError(null);
        try {
            walletConnect.openConnectModal();
        } catch (err) {
            const connectError = err instanceof Error ? err : new Error(String(err));
            setError(connectError);
        }
    }, [walletConnect]);

    /**
     * Disconnect the current wallet.
     */
    const disconnect = useCallback(() => {
        setError(null);
        try {
            walletConnect.disconnect();
        } catch (err) {
            const disconnectError = err instanceof Error ? err : new Error(String(err));
            setError(disconnectError);
        }
    }, [walletConnect]);

    const isConnected = walletConnect.address !== null;

    return {
        address: walletConnect.walletAddress,
        addressObject: walletConnect.address,
        publicKey: walletConnect.publicKey,
        mldsaPublicKey: walletConnect.mldsaPublicKey,
        isConnected,
        isConnecting: walletConnect.connecting,
        error,
        walletType: walletConnect.walletType,
        provider: walletConnect.provider,
        signer: walletConnect.signer,
        balance: walletConnect.walletBalance,
        openConnectModal,
        disconnect,
    };
}
