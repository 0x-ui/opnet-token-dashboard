import { useState, useCallback } from 'react';

import { useOP20 } from '../hooks/useContract';
import { useWallet } from '../hooks/useWallet';

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
 * Allows users to input an OP20 token address and view its information.
 */
export function TokenExplorer() {
    const [contractAddress, setContractAddress] = useState('');
    const [activeAddress, setActiveAddress] = useState('');
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [userBalance, setUserBalance] = useState<bigint | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);

    const { getName, getSymbol, getDecimals, getTotalSupply, getBalanceOf } =
        useOP20(activeAddress);
    const { addressObject, isConnected } = useWallet();

    const handleExplore = useCallback(async () => {
        if (!contractAddress.trim()) return;

        setFetchError(null);
        setTokenData(null);
        setUserBalance(null);
        setIsFetching(true);
        setActiveAddress(contractAddress.trim());

        try {
            await new Promise((resolve) => setTimeout(resolve, 100));
        } catch {
            // timing delay for state propagation
        }

        setIsFetching(false);
    }, [contractAddress]);

    const handleFetchData = useCallback(async () => {
        if (!activeAddress) return;

        setFetchError(null);
        setIsFetching(true);

        try {
            const [name, symbol, decimals, totalSupply] = await Promise.all([
                getName(),
                getSymbol(),
                getDecimals(),
                getTotalSupply(),
            ]);

            if (name === null || symbol === null || decimals === null || totalSupply === null) {
                setFetchError(
                    'Could not fetch token data. Make sure the address is a valid OP20 token.',
                );
                setIsFetching(false);
                return;
            }

            setTokenData({ name, symbol, decimals, totalSupply });

            if (isConnected && addressObject) {
                const balance = await getBalanceOf(addressObject);
                setUserBalance(balance);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setFetchError(`Failed to fetch token: ${message}`);
        } finally {
            setIsFetching(false);
        }
    }, [
        activeAddress,
        getName,
        getSymbol,
        getDecimals,
        getTotalSupply,
        getBalanceOf,
        isConnected,
        addressObject,
    ]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            await handleExplore();
            setTimeout(() => {
                void handleFetchData();
            }, 200);
        },
        [handleExplore, handleFetchData],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                void handleSubmit(e as unknown as React.FormEvent);
            }
        },
        [handleSubmit],
    );

    return (
        <div className="token-explorer">
            <div className="explorer-search">
                <h2 className="section-title">Explore Token</h2>
                <form className="search-form" onSubmit={(e) => void handleSubmit(e)}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Enter OP20 token contract address (bc1p...)"
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button type="submit" className="btn btn-primary" disabled={isFetching}>
                        {isFetching ? 'Loading...' : 'Explore'}
                    </button>
                </form>
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

                    {isConnected && userBalance !== null && (
                        <div className="balance-card">
                            <span className="balance-label">Your Balance</span>
                            <span className="balance-value">
                                {formatTokenAmount(userBalance, tokenData.decimals)}{' '}
                                <span className="balance-symbol">{tokenData.symbol}</span>
                            </span>
                        </div>
                    )}

                    {!isConnected && (
                        <div className="info-card">
                            <p>Connect your OP_WALLET to see your token balance</p>
                        </div>
                    )}
                </div>
            )}

            {!tokenData && !fetchError && !isFetching && (
                <div className="empty-state">
                    <span className="empty-icon">&#x20BF;</span>
                    <h3>Enter a Token Address</h3>
                    <p>
                        Paste any OP20 token contract address above to view its details, supply, and
                        your balance.
                    </p>
                </div>
            )}
        </div>
    );
}
