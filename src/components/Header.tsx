import { useWalletConnect } from '@btc-vision/walletconnect';

import { useOPNet, OPNetNetworkId } from '../providers/OPNetProvider';

/**
 * Truncates a Bitcoin address for display.
 *
 * @param addr - The full address string
 * @returns Truncated address like "bc1p...x4f2"
 */
function truncateAddress(addr: string): string {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

/**
 * Header component with branding, network selector, and wallet connection.
 */
export function Header() {
    const {
        walletAddress,
        walletType,
        walletBalance,
        connecting,
        openConnectModal,
        disconnect,
    } = useWalletConnect();

    const { networkId, switchNetwork, isConnected: rpcConnected } = useOPNet();

    const isConnected = walletAddress !== null;

    const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        switchNetwork(e.target.value as OPNetNetworkId);
    };

    return (
        <header className="header">
            <div className="header-brand">
                <span className="header-logo">&#x20BF;</span>
                <div>
                    <h1 className="header-title">OPNet Token Dashboard</h1>
                    <p className="header-subtitle">Explore OP20 tokens on Bitcoin L1</p>
                </div>
            </div>

            <div className="header-controls">
                <div className="network-selector">
                    <div
                        className={`status-dot ${rpcConnected ? 'connected' : 'disconnected'}`}
                    />
                    <select
                        value={networkId}
                        onChange={handleNetworkChange}
                        className="network-select"
                    >
                        <option value="mainnet">Mainnet</option>
                        <option value="regtest">Regtest</option>
                    </select>
                </div>

                {isConnected && walletAddress ? (
                    <div className="wallet-connected">
                        <div className="wallet-info">
                            <span className="wallet-type">{walletType}</span>
                            <span className="wallet-addr">
                                {truncateAddress(walletAddress)}
                            </span>
                            {walletBalance !== null && walletBalance !== undefined && (
                                <span className="wallet-bal">
                                    {(walletBalance.total / 1e8).toFixed(8)} BTC
                                </span>
                            )}
                        </div>
                        <button className="btn btn-sm btn-outline" onClick={disconnect}>
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button
                        className="btn btn-primary"
                        onClick={openConnectModal}
                        disabled={connecting}
                    >
                        {connecting ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                )}
            </div>
        </header>
    );
}
