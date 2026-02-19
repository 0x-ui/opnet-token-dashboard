import { useState, useCallback, useRef } from 'react';
import { getContract, IOP20Contract, OP_20_ABI } from 'opnet';
import { useWalletConnect } from '@btc-vision/walletconnect';

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
    const trimmed = remainderStr.replace(/0+$/, '').slice(0, 6);

    if (trimmed.length === 0) {
        return whole.toLocaleString();
    }
    return `${whole.toLocaleString()}.${trimmed}`;
}

/**
 * SVG supply visualization showing ownership share.
 *
 * @param balance - User's token balance
 * @param totalSupply - Total token supply
 * @param symbol - Token symbol
 */
function SupplyVisualization({
    balance,
    totalSupply,
    symbol,
}: {
    balance: bigint;
    totalSupply: bigint;
    symbol: string;
}) {
    const sharePercent =
        totalSupply > 0n ? Number((balance * 10000n) / totalSupply) / 100 : 0;
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const fillLength = (Math.min(sharePercent, 100) / 100) * circumference;

    return (
        <div className="supply-viz">
            <svg viewBox="0 0 140 140" className="supply-ring">
                <defs>
                    <linearGradient id="supplyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f7931a" />
                        <stop offset="100%" stopColor="#ffcc00" />
                    </linearGradient>
                </defs>
                <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="rgba(30,30,53,0.6)"
                    strokeWidth="8"
                />
                <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="url(#supplyGrad)"
                    strokeWidth="8"
                    strokeDasharray={`${fillLength} ${circumference - fillLength}`}
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                    className="supply-ring-fill"
                />
                <text
                    x="70"
                    y="64"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#e8e8f0"
                    fontSize="18"
                    fontWeight="700"
                    fontFamily="'SF Mono', monospace"
                >
                    {sharePercent < 0.01 && sharePercent > 0
                        ? '<0.01'
                        : sharePercent.toFixed(sharePercent >= 1 ? 1 : 2)}
                    %
                </text>
                <text
                    x="70"
                    y="82"
                    textAnchor="middle"
                    fill="#7a7a98"
                    fontSize="9"
                    fontWeight="600"
                    letterSpacing="1"
                >
                    OF {symbol}
                </text>
            </svg>
            <span className="supply-viz-label">Your Supply Share</span>
        </div>
    );
}

/**
 * Token Explorer component with enhanced visuals.
 * Fetches OP20 token data, displays stats and supply visualization.
 */
export function TokenExplorer() {
    const [contractAddress, setContractAddress] = useState('');
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [activeAddress, setActiveAddress] = useState('');
    const [userBalance, setUserBalance] = useState<bigint | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const contractRef = useRef<IOP20Contract | null>(null);

    const { provider, network, isConnected: rpcConnected } = useOPNet();
    const { address: walletAddressObj, walletAddress } = useWalletConnect();
    const walletConnected = walletAddress !== null;

    const handleExplore = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            const addr = contractAddress.trim();
            if (!addr) return;

            if (!provider || !rpcConnected) {
                setFetchError(
                    'Not connected to OPNet RPC. Please wait or try a different network.',
                );
                return;
            }

            setFetchError(null);
            setTokenData(null);
            setUserBalance(null);
            setIsFetching(true);
            setActiveAddress(addr);

            try {
                const contract = getContract<IOP20Contract>(
                    addr,
                    OP_20_ABI,
                    provider,
                    network,
                );
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

                if (walletConnected && walletAddressObj) {
                    try {
                        const balanceResult = await contract.balanceOf(walletAddressObj);
                        setUserBalance(balanceResult.properties.balance);
                    } catch {
                        setUserBalance(null);
                    }
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                setFetchError(`Failed to fetch token: ${message}`);
            } finally {
                setIsFetching(false);
            }
        },
        [contractAddress, provider, network, rpcConnected, walletConnected, walletAddressObj],
    );

    return (
        <div className="token-explorer panel">
            <div className="panel-header">
                <h2 className="panel-title">
                    <span className="panel-icon">{'\uD83D\uDD0D'}</span>
                    Token Explorer
                </h2>
                <p className="panel-desc">
                    Deep-dive into any OP20 token on Bitcoin L1
                </p>
            </div>

            <form className="search-form" onSubmit={(e) => void handleExplore(e)}>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Enter OP20 contract address (bc1p...)"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                />
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isFetching || !rpcConnected}
                >
                    {isFetching ? 'Fetching...' : 'Explore'}
                </button>
            </form>

            {!rpcConnected && (
                <p className="rpc-status">Connecting to OPNet RPC...</p>
            )}

            {fetchError && (
                <div className="error-card">
                    <p>{fetchError}</p>
                </div>
            )}

            {tokenData && (
                <div className="token-details">
                    <div className="token-hero">
                        <div className="token-hero-left">
                            <div className="token-identity">
                                <span className="token-symbol-badge">
                                    {tokenData.symbol.slice(0, 4)}
                                </span>
                                <div>
                                    <h3 className="token-name">{tokenData.name}</h3>
                                    <span className="token-address-mini" title={activeAddress}>
                                        {activeAddress.slice(0, 14)}...{activeAddress.slice(-6)}
                                    </span>
                                </div>
                            </div>

                            <div className="token-stats-grid">
                                <div className="token-stat">
                                    <span className="stat-label">Symbol</span>
                                    <span className="token-stat-value">
                                        {tokenData.symbol}
                                    </span>
                                </div>
                                <div className="token-stat">
                                    <span className="stat-label">Decimals</span>
                                    <span className="token-stat-value">
                                        {tokenData.decimals}
                                    </span>
                                </div>
                                <div className="token-stat">
                                    <span className="stat-label">Total Supply</span>
                                    <span className="token-stat-value">
                                        {formatTokenAmount(
                                            tokenData.totalSupply,
                                            tokenData.decimals,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {walletConnected && userBalance !== null && (
                            <div className="token-hero-right">
                                <SupplyVisualization
                                    balance={userBalance}
                                    totalSupply={tokenData.totalSupply}
                                    symbol={tokenData.symbol}
                                />
                            </div>
                        )}
                    </div>

                    {walletConnected && userBalance !== null && (
                        <div className="balance-card">
                            <div className="balance-card-inner">
                                <div>
                                    <span className="balance-label">Your Balance</span>
                                    <span className="balance-value">
                                        {formatTokenAmount(userBalance, tokenData.decimals)}{' '}
                                        <span className="balance-symbol">
                                            {tokenData.symbol}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {!walletConnected && (
                        <div className="info-card">
                            <p>Connect your wallet to see your balance and supply share</p>
                        </div>
                    )}
                </div>
            )}

            {!tokenData && !fetchError && !isFetching && (
                <div className="empty-state explorer-empty">
                    <div className="explorer-empty-visual">
                        <div className="empty-rings">
                            <div className="ring ring-1" />
                            <div className="ring ring-2" />
                            <div className="ring ring-3" />
                            <span className="empty-icon">&#x20BF;</span>
                        </div>
                    </div>
                    <h3>Explore Any OP20 Token</h3>
                    <p>
                        Paste a token contract address to view on-chain data, total supply,
                        and your ownership share.
                    </p>
                </div>
            )}
        </div>
    );
}
