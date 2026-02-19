import { useOPNet, OPNetNetworkId } from '../providers/OPNetProvider';

type TabId = 'dashboard' | 'portfolio' | 'explorer';

interface HeaderProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

/**
 * Header with branding, tab navigation, and network selector.
 *
 * @param activeTab - Currently active tab
 * @param onTabChange - Callback when tab changes
 */
export function Header({ activeTab, onTabChange }: HeaderProps) {
    const { networkId, switchNetwork, isConnected: rpcConnected } = useOPNet();

    const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        switchNetwork(e.target.value as OPNetNetworkId);
    };

    const tabs: { id: TabId; label: string; icon: string }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: '\u26A1' },
        { id: 'portfolio', label: 'Portfolio', icon: '\uD83D\uDCBC' },
        { id: 'explorer', label: 'Explorer', icon: '\uD83D\uDD0D' },
    ];

    return (
        <header className="header">
            <div className="header-left">
                <div className="header-brand">
                    <div className="logo-glow">
                        <span className="header-logo">&#x20BF;</span>
                    </div>
                    <div>
                        <h1 className="header-title">OPNet Command Center</h1>
                        <p className="header-subtitle">
                            Bitcoin L1 Smart Contract Intelligence
                        </p>
                    </div>
                </div>

                <nav className="tab-nav">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => onTabChange(tab.id)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
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
