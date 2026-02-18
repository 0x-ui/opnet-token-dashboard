import { useOPNet, OPNetNetworkId } from '../providers/OPNetProvider';

/**
 * Header component with branding and network selector.
 */
export function Header() {
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
            </div>
        </header>
    );
}
