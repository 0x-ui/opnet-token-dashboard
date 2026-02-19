import { useState } from 'react';
import { OPNetProvider } from './providers/OPNetProvider';
import { Header } from './components/Header';
import { NetworkStats } from './components/NetworkStats';
import { TokenExplorer } from './components/TokenExplorer';
import { Portfolio } from './components/Portfolio';
import { WalletPanel } from './components/WalletPanel';

type TabId = 'dashboard' | 'portfolio' | 'explorer';

/**
 * Main application component.
 * Tabbed dashboard layout for the OPNet Command Center.
 */
function App() {
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');

    return (
        <OPNetProvider defaultNetwork="mainnet">
            <div className="app">
                <div className="animated-bg" />
                <Header activeTab={activeTab} onTabChange={setActiveTab} />
                <main className="dashboard">
                    {activeTab === 'dashboard' && (
                        <div className="dashboard-grid">
                            <section className="dashboard-main">
                                <NetworkStats />
                            </section>
                            <aside className="dashboard-sidebar">
                                <WalletPanel />
                                <div className="info-panel">
                                    <h3 className="panel-title">
                                        <span className="panel-icon">&#x2139;</span>
                                        About OPNet
                                    </h3>
                                    <p className="info-text">
                                        OPNet is a Bitcoin L1 consensus layer enabling trustless
                                        smart contracts directly on Bitcoin. No bridges, no
                                        sidechains, no wrapped tokens.
                                    </p>
                                    <div className="info-features">
                                        <div className="info-feature">
                                            <span className="feature-dot" />
                                            Trustless execution
                                        </div>
                                        <div className="info-feature">
                                            <span className="feature-dot" />
                                            Bitcoin-native security
                                        </div>
                                        <div className="info-feature">
                                            <span className="feature-dot" />
                                            OP20 token standard
                                        </div>
                                        <div className="info-feature">
                                            <span className="feature-dot" />
                                            Quantum-resistant (ML-DSA)
                                        </div>
                                    </div>
                                    <a
                                        href="https://opnet.org"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline btn-sm info-link"
                                    >
                                        Learn More
                                    </a>
                                </div>
                            </aside>
                        </div>
                    )}

                    {activeTab === 'portfolio' && <Portfolio />}

                    {activeTab === 'explorer' && (
                        <div className="explorer-layout">
                            <TokenExplorer />
                        </div>
                    )}
                </main>
                <footer className="footer">
                    <p>
                        Built on Bitcoin L1 with{' '}
                        <a
                            href="https://opnet.org"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            OP_NET
                        </a>
                    </p>
                    <p className="footer-sub">#opnetvibecode</p>
                </footer>
            </div>
        </OPNetProvider>
    );
}

export default App;
