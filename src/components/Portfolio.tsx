import { useState, useCallback } from 'react';
import { getContract, IOP20Contract, OP_20_ABI } from 'opnet';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useOPNet } from '../providers/OPNetProvider';

interface PortfolioToken {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
    balance: bigint;
    supplyShare: number;
}

const CHART_COLORS = [
    '#f7931a', '#00d68f', '#4d9fff', '#9b59ff',
    '#ff4d6a', '#ffcc00', '#00cccc', '#ff8c42',
];

/**
 * Formats a bigint token amount to a human-readable string.
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
    const trimmed = remainderStr.replace(/0+$/, '').slice(0, 4);

    if (trimmed.length === 0) {
        return whole.toLocaleString();
    }
    return `${whole.toLocaleString()}.${trimmed}`;
}

/**
 * Calculates what percentage of total supply a balance represents.
 *
 * @param balance - User's token balance
 * @param totalSupply - Total token supply
 * @returns Percentage as a number (0-100)
 */
function calcSupplyShare(balance: bigint, totalSupply: bigint): number {
    if (totalSupply === 0n) return 0;
    return Number((balance * 10000n) / totalSupply) / 100;
}

/**
 * SVG donut chart segment data.
 */
interface DonutSegment {
    color: string;
    percentage: number;
    label: string;
}

/**
 * Renders an SVG donut chart from portfolio data.
 *
 * @param segments - Chart segments with color, percentage, and label
 */
function DonutChart({ segments }: { segments: DonutSegment[] }) {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return (
        <svg viewBox="0 0 200 200" className="donut-chart">
            <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="rgba(30,30,53,0.8)"
                strokeWidth="24"
            />
            {segments.map((seg, i) => {
                const dashLength = (seg.percentage / 100) * circumference;
                const dashGap = circumference - dashLength;
                const offset = -accumulatedOffset;
                accumulatedOffset += dashLength;

                return (
                    <circle
                        key={`${seg.label}-${i}`}
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="24"
                        strokeDasharray={`${dashLength} ${dashGap}`}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                        className="donut-segment"
                    />
                );
            })}
            <text
                x="100"
                y="95"
                textAnchor="middle"
                className="donut-center-text"
                fill="#e8e8f0"
                fontSize="22"
                fontWeight="700"
            >
                {segments.length}
            </text>
            <text
                x="100"
                y="115"
                textAnchor="middle"
                fill="#7a7a98"
                fontSize="11"
                fontWeight="500"
            >
                TOKENS
            </text>
        </svg>
    );
}

/**
 * SVG circular gauge showing supply ownership.
 *
 * @param percentage - Ownership percentage (0-100)
 * @param color - Gauge fill color
 * @param size - Gauge diameter in pixels
 */
function SupplyGauge({
    percentage,
    color,
    size = 64,
}: {
    percentage: number;
    color: string;
    size?: number;
}) {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const fillLength = (Math.min(percentage, 100) / 100) * circumference;
    const center = size / 2;

    return (
        <svg width={size} height={size} className="supply-gauge">
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="rgba(30,30,53,0.6)"
                strokeWidth="4"
            />
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeDasharray={`${fillLength} ${circumference - fillLength}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${center} ${center})`}
                className="gauge-fill"
            />
            <text
                x={center}
                y={center + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontSize={size < 50 ? '9' : '11'}
                fontWeight="700"
                fontFamily="'SF Mono', monospace"
            >
                {percentage < 0.01 && percentage > 0
                    ? '<0.01%'
                    : `${percentage.toFixed(percentage >= 1 ? 1 : 2)}%`}
            </text>
        </svg>
    );
}

/**
 * Portfolio component.
 * Lets users add multiple token addresses, fetches all balances,
 * and displays a visual portfolio overview with charts and gauges.
 */
export function Portfolio() {
    const [tokens, setTokens] = useState<PortfolioToken[]>([]);
    const [inputAddr, setInputAddr] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { provider, network, isConnected } = useOPNet();
    const { address: walletAddressObj, walletAddress, openConnectModal } = useWalletConnect();
    const walletConnected = walletAddress !== null;

    const addToken = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            const addr = inputAddr.trim();
            if (!addr || !provider || !isConnected) return;

            if (tokens.some((t) => t.address === addr)) {
                setError('Token already added');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const contract = getContract<IOP20Contract>(
                    addr,
                    OP_20_ABI,
                    provider,
                    network,
                );

                const [nameRes, symbolRes, decimalsRes, supplyRes] = await Promise.all([
                    contract.name(),
                    contract.symbol(),
                    contract.decimals(),
                    contract.totalSupply(),
                ]);

                let balance = 0n;
                if (walletConnected && walletAddressObj) {
                    try {
                        const balRes = await contract.balanceOf(walletAddressObj);
                        balance = balRes.properties.balance;
                    } catch {
                        // Wallet may not hold this token
                    }
                }

                const totalSupply = supplyRes.properties.totalSupply;
                const token: PortfolioToken = {
                    address: addr,
                    name: nameRes.properties.name,
                    symbol: symbolRes.properties.symbol,
                    decimals: decimalsRes.properties.decimals,
                    totalSupply,
                    balance,
                    supplyShare: calcSupplyShare(balance, totalSupply),
                };

                setTokens((prev) => [...prev, token]);
                setInputAddr('');
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                setError(`Failed to load token: ${msg}`);
            } finally {
                setLoading(false);
            }
        },
        [inputAddr, provider, network, isConnected, walletConnected, walletAddressObj, tokens],
    );

    const removeToken = (address: string) => {
        setTokens((prev) => prev.filter((t) => t.address !== address));
    };

    const donutSegments: DonutSegment[] = tokens.map((t, i) => ({
        color: CHART_COLORS[i % CHART_COLORS.length] ?? '#888',
        percentage: tokens.length > 0 ? 100 / tokens.length : 0,
        label: t.symbol,
    }));

    return (
        <div className="portfolio-panel panel">
            <div className="panel-header">
                <h2 className="panel-title">
                    <span className="panel-icon">{'\uD83D\uDCBC'}</span>
                    Portfolio
                </h2>
            </div>

            {!walletConnected && (
                <div className="portfolio-connect">
                    <div className="connect-visual">
                        <div className="connect-rings">
                            <div className="ring ring-1" />
                            <div className="ring ring-2" />
                            <div className="ring ring-3" />
                            <span className="connect-icon">&#x20BF;</span>
                        </div>
                    </div>
                    <h3 className="connect-title">Connect Your Wallet</h3>
                    <p className="connect-desc">
                        Connect your OP_WALLET to view your token balances, track your portfolio,
                        and see your share of each token&apos;s supply.
                    </p>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => void openConnectModal()}
                    >
                        Connect Wallet
                    </button>
                </div>
            )}

            {walletConnected && (
                <>
                    <div className="portfolio-wallet-bar">
                        <div className="status-dot connected" />
                        <span className="portfolio-addr" title={walletAddress}>
                            {walletAddress.slice(0, 12)}...{walletAddress.slice(-6)}
                        </span>
                        <span className="portfolio-count">
                            {tokens.length} token{tokens.length !== 1 ? 's' : ''} tracked
                        </span>
                    </div>

                    <form
                        className="portfolio-add-form"
                        onSubmit={(e) => void addToken(e)}
                    >
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Add token by contract address (bc1p...)"
                            value={inputAddr}
                            onChange={(e) => setInputAddr(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !isConnected}
                        >
                            {loading ? 'Adding...' : 'Add'}
                        </button>
                    </form>

                    {error && (
                        <div className="error-card">
                            <p>{error}</p>
                        </div>
                    )}

                    {tokens.length > 0 && (
                        <div className="portfolio-overview">
                            <div className="portfolio-chart-section">
                                <DonutChart segments={donutSegments} />
                                <div className="chart-legend">
                                    {tokens.map((t, i) => (
                                        <div key={t.address} className="legend-item">
                                            <span
                                                className="legend-color"
                                                style={{
                                                    background:
                                                        CHART_COLORS[i % CHART_COLORS.length],
                                                }}
                                            />
                                            <span className="legend-symbol">{t.symbol}</span>
                                            <span className="legend-balance">
                                                {formatTokenAmount(t.balance, t.decimals)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="portfolio-grid">
                                {tokens.map((token, i) => (
                                    <div key={token.address} className="portfolio-card">
                                        <div className="portfolio-card-header">
                                            <div className="portfolio-token-info">
                                                <span
                                                    className="portfolio-badge"
                                                    style={{
                                                        background:
                                                            CHART_COLORS[
                                                                i % CHART_COLORS.length
                                                            ],
                                                    }}
                                                >
                                                    {token.symbol.slice(0, 3)}
                                                </span>
                                                <div>
                                                    <span className="portfolio-token-name">
                                                        {token.name}
                                                    </span>
                                                    <span className="portfolio-token-symbol">
                                                        {token.symbol}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                className="remove-btn"
                                                onClick={() => removeToken(token.address)}
                                                title="Remove token"
                                            >
                                                &#x2715;
                                            </button>
                                        </div>

                                        <div className="portfolio-card-body">
                                            <div className="portfolio-balance-section">
                                                <span className="stat-label">Your Balance</span>
                                                <span className="portfolio-balance-value">
                                                    {formatTokenAmount(
                                                        token.balance,
                                                        token.decimals,
                                                    )}
                                                </span>
                                                <span className="stat-label">Total Supply</span>
                                                <span className="portfolio-supply-value">
                                                    {formatTokenAmount(
                                                        token.totalSupply,
                                                        token.decimals,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="portfolio-gauge-section">
                                                <SupplyGauge
                                                    percentage={token.supplyShare}
                                                    color={
                                                        CHART_COLORS[
                                                            i % CHART_COLORS.length
                                                        ] ?? '#888'
                                                    }
                                                    size={80}
                                                />
                                                <span className="gauge-label">
                                                    Supply Share
                                                </span>
                                            </div>
                                        </div>

                                        <div className="portfolio-card-footer">
                                            <span
                                                className="portfolio-addr-mini"
                                                title={token.address}
                                            >
                                                {token.address.slice(0, 10)}...
                                                {token.address.slice(-4)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tokens.length === 0 && !loading && (
                        <div className="empty-state">
                            <span className="empty-icon">{'\uD83D\uDCBC'}</span>
                            <h3>No Tokens Tracked</h3>
                            <p>
                                Add OP20 token contract addresses above to track your holdings
                                and see your share of each token&apos;s supply.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
