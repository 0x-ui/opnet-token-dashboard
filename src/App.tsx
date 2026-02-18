import { WalletConnectProvider } from '@btc-vision/walletconnect';

import { OPNetProvider } from './providers/OPNetProvider';
import { Header } from './components/Header';
import { TokenExplorer } from './components/TokenExplorer';

/**
 * Main application component.
 * Wraps everything with OPNet and WalletConnect providers.
 */
function App() {
    return (
        <OPNetProvider defaultNetwork="mainnet">
            <WalletConnectProvider theme="dark">
                <div className="app">
                    <Header />
                    <main className="main">
                        <TokenExplorer />
                    </main>
                    <footer className="footer">
                        <p>
                            Built on Bitcoin L1 with{' '}
                            <a href="https://opnet.org" target="_blank" rel="noopener noreferrer">
                                OP_NET
                            </a>
                        </p>
                        <p className="footer-sub">#opnetvibecode</p>
                    </footer>
                </div>
            </WalletConnectProvider>
        </OPNetProvider>
    );
}

export default App;
