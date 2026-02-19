import { useWalletConnect } from '@btc-vision/walletconnect';

/**
 * Wallet connection panel.
 * Shows connect button or wallet info when connected.
 */
export function WalletPanel() {
    const { walletAddress, openConnectModal, disconnect } = useWalletConnect();
    const connected = walletAddress !== null;

    return (
        <div className="wallet-panel">
            {connected ? (
                <div className="wallet-connected-info">
                    <div className="wallet-status-row">
                        <div className="status-dot connected" />
                        <span className="wallet-label">Wallet Connected</span>
                    </div>
                    <div className="wallet-address-display">
                        <span className="wallet-addr-full" title={walletAddress}>
                            {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                        </span>
                    </div>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => void disconnect()}
                    >
                        Disconnect
                    </button>
                </div>
            ) : (
                <div className="wallet-connect-prompt">
                    <span className="wallet-icon-large">&#x1F4B0;</span>
                    <p className="wallet-prompt-text">
                        Connect your wallet to view token balances and interact with contracts
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => void openConnectModal()}
                    >
                        Connect Wallet
                    </button>
                </div>
            )}
        </div>
    );
}
