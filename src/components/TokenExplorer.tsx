import { useState, useCallback, useRef } from 'react';
import { getContract, IOP20Contract, OP_20_ABI } from 'opnet';

import { useOPNet } from '../providers/OPNetProvider';

interface TokenData {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
}

/**
 * Formats a bigint token amount to a human-readable string using decimals.
 *
 * @param amount - The raw token amount as bigint
 * @param decimals - Number of decimal places
 * @returns Formatted string representation
 */
function formatTokenAmount(amount: bigint, decimals: number): string {
    const divisor = 10n ** BigInt(decimals);
    const whole = amount / divisor;
    const remainder = amount % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmed = remainderStr.replace(/0+$/, '');

    if (trimmed.length === 0) {
        return whole.toLocaleString();
    }
    return `${whole.toLocaleString()}.${trimmed}`;
}

/**
 * Token Explorer component.
 * Fetches OP20 token data directly from the OPNet RPC provider.
 * No wallet connection required.
 */
export function TokenExplorer() {
    const [contractAddress, setContractAddress] = useState('');
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [activeAddress, setActiveAddress] = useState('');
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const contractRef = useRef<IOP20Contract | null>(null);

    const { provider, network, isConnected: rpcConnected } = useOPNet();

    const handleExplore = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            const addr = contractAddress.trim();
            if (!addr) return;

            if (!provider || !rpcConnected) {
                setFetchError('Not connected to OPNet RPC. Please wait or try a different network.');
                return;
            }

            setFetchError(null);
            setTokenData(null);
            setIsFetching(true);
            setActiveAddress(addr);

            try {
                const contract = getContract<IOP20Contract>(addr, OP_20_ABI, provider, network);
                contractRef.current = contract;

                const [nameResult, symbolResult, decimalsResult, totalSupplyResult] =
                    await Promise.all([
                        contract.name(),
                        contract.symbol(),
                        contract.decimals(),
                        contract.totalSupply(),
                    ]);

                const name = nameResult.properties.name;
                const symbol = symbolResult.properties.symbol;
                const decimals = decimalsResult.properties.decimals;
                const totalSupply = totalSupplyResult.properties.totalSupply;

                setTokenData({ name, symbol, decimals, totalSupply });
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                setFetchError(`Failed to fetch token: ${message}`);
            } finally {
                setIsFetching(false);
            }
        },
        [contractAddress, provider, network, rpcConnected],
    );

    return (
        <div className="token-explorer">
            <div className="explorer-search">
                <h2 className="section-title">Explore Token</h2>
                <form className="search-form" onSubmit={(e) => void handleExplore(e)}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Enter OP20 token contract address (bc1p...)"
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isFetching || !rpcConnected}
                    >
                        {isFetching ? 'Loading...' : 'Explore'}
                    </button>
                </form>
                {!rpcConnected && (
                    <p className="rpc-status">Connecting to OPNet RPC...</p>
                )}
            </div>

            {fetchError && (
                <div className="error-card">
                    <p>{fetchError}</p>
                </div>
            )}

            {tokenData && (
                <div className="token-details">
                    <div className="token-header-card">
                        <div className="token-identity">
                            <span className="token-symbol-badge">{tokenData.symbol}</span>
                            <h3 className="token-name">{tokenData.name}</h3>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-label">Symbol</span>
                            <span className="stat-value">{tokenData.symbol}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Decimals</span>
                            <span className="stat-value">{tokenData.decimals}</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Total Supply</span>
                            <span className="stat-value">
                                {formatTokenAmount(tokenData.totalSupply, tokenData.decimals)}
                            </span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Contract</span>
                            <span className="stat-value stat-address" title={activeAddress}>
                                {activeAddress.slice(0, 12)}...{activeAddress.slice(-6)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {!tokenData && !fetchError && !isFetching && (
                <div className="empty-state">
                    <span className="empty-icon">&#x20BF;</span>
                    <h3>Enter a Token Address</h3>
                    <p>
                        Paste any OP20 token contract address above to view its details and supply
                        directly from Bitcoin L1.
                    </p>
                </div>
            )}
        </div>
    );
}
