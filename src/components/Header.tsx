import { useOPNet, OPNetNetworkId } from '../providers/OPNetProvider';

/**
 * Minimal header with branding and network selector.
 */
export function Header() {
    const { networkId, switchNetwork, isConnected: rpcConnected } = useOPNet();

    const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        switchNetwork(e.target.value as OPNetNetworkId);
    };

    return (
        <header className="header">
            <div className="header-brand">
                <div className="logo-glow">
                    <span className="header-logo">&#x20BF;</span>
                </div>
                <div>
                    <h1 className="header-title">OPNet Command Center</h1>
                    <p className="header-subtitle">Real-time Bitcoin L1 Smart Contract Intelligence</p>
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
                <div className="live-badge">
                    <span className="live-dot" />
                    LIVE
                </div>
            </div>
        </header>
    );
}
