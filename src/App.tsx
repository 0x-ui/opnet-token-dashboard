import { OPNetProvider } from './providers/OPNetProvider';
import { Header } from './components/Header';
import { TokenExplorer } from './components/TokenExplorer';

/**
 * Main application component.
 * WalletConnectProvider wraps everything in main.tsx.
 */
function App() {
    return (
        <OPNetProvider defaultNetwork="mainnet">
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
        </OPNetProvider>
    );
}

export default App;
