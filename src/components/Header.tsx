import { useWallet } from '../hooks/useWallet';
import { useOPNet, OPNetNetworkId } from '../providers/OPNetProvider';

/**
 * Truncates a Bitcoin address for display.
 *
 * @param address - The full address string
 * @returns Truncated address like "bc1p...x4f2"
 */
function truncateAddress(address: string): string {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
}

/**
 * Header component with branding, network selector, and wallet connection.
 */
export function Header() {
    const {
        address,
        isConnected,
        isConnecting,
        walletType,
        openConnectModal,
        disconnect,
        balance,
    } = useWallet();
    const { networkId, switchNetwork, isConnected: rpcConnected } = useOPNet();

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
                    <div className={`status-dot ${rpcConnected ? 'connected' : 'disconnected'}`} />
                    <select
                        value={networkId}
                        onChange={handleNetworkChange}
                        className="network-select"
                    >
                        <option value="mainnet">Mainnet</option>
                        <option value="regtest">Regtest</option>
                    </select>
                </div>

                {isConnected && address ? (
                    <div className="wallet-connected">
                        <div className="wallet-info">
                            <span className="wallet-type">{walletType}</span>
                            <span className="wallet-addr">{truncateAddress(address)}</span>
                            {balance !== null && balance !== undefined && (
                                <span className="wallet-bal">
                                    {(Number(balance) / 1e8).toFixed(8)} BTC
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
                        disabled={isConnecting}
                    >
                        {isConnecting ? 'Connecting...' : 'Connect OP_WALLET'}
                    </button>
                )}
            </div>
        </header>
    );
}
