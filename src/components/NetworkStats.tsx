import { useState, useEffect, useCallback, useRef } from 'react';
import { useOPNet } from '../providers/OPNetProvider';

interface GasData {
    blockNumber: bigint;
    gasUsed: bigint;
    targetGasLimit: bigint;
    baseGas: bigint;
    gasPerSat: bigint;
    ema: bigint;
    bitcoin: {
        conservative: number;
        recommended: {
            low: number;
            medium: number;
            high: number;
        };
    };
}

interface BlockData {
    height: bigint;
    hash: string;
    time: number;
    txCount: number;
    gasUsed: bigint;
    size: number;
}

/**
 * Formats a bigint to a compact human-readable string.
 *
 * @param value - The bigint value to format
 * @returns Formatted string with commas
 */
function formatBigInt(value: bigint): string {
    return value.toLocaleString();
}

/**
 * Formats a Unix timestamp to a relative "time ago" string.
 *
 * @param unixTimestamp - Unix timestamp in seconds
 * @returns Human-readable relative time string
 */
function timeAgo(unixTimestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000) - unixTimestamp;
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
}

/**
 * Network statistics panel showing live blockchain data.
 * Auto-refreshes block height, gas parameters, and fee estimates.
 */
export function NetworkStats() {
    const { provider, isConnected, networkId } = useOPNet();
    const [blockHeight, setBlockHeight] = useState<bigint | null>(null);
    const [gasData, setGasData] = useState<GasData | null>(null);
    const [latestBlock, setLatestBlock] = useState<BlockData | null>(null);
    const [recentBlocks, setRecentBlocks] = useState<BlockData[]>([]);
    const [lastUpdate, setLastUpdate] = useState<number>(0);
    const [pulseBlock, setPulseBlock] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchData = useCallback(async () => {
        if (!provider || !isConnected) return;

        try {
            const [height, gas] = await Promise.all([
                provider.getBlockNumber(),
                provider.gasParameters(),
            ]);

            const heightChanged = blockHeight !== null && height !== blockHeight;
            setBlockHeight(height);
            setGasData(gas as unknown as GasData);
            setLastUpdate(Date.now());

            if (heightChanged) {
                setPulseBlock(true);
                setTimeout(() => setPulseBlock(false), 1000);
            }

            const block = await provider.getBlock(height);
            const blockData: BlockData = {
                height: BigInt(block.height),
                hash: block.hash,
                time: block.time,
                txCount: block.txCount,
                gasUsed: block.gasUsed,
                size: block.size,
            };
            setLatestBlock(blockData);

            const blockNumbers: bigint[] = [];
            for (let i = 0; i < 6; i++) {
                const num = height - BigInt(i);
                if (num >= 0n) {
                    blockNumbers.push(num);
                }
            }

            if (blockNumbers.length > 0) {
                const blocks = await provider.getBlocks(blockNumbers);
                setRecentBlocks(
                    blocks.map((b) => ({
                        height: BigInt(b.height),
                        hash: b.hash,
                        time: b.time,
                        txCount: b.txCount,
                        gasUsed: b.gasUsed,
                        size: b.size,
                    })),
                );
            }
        } catch {
            // Silently retry on next interval
        }
    }, [provider, isConnected, blockHeight]);

    useEffect(() => {
        void fetchData();

        intervalRef.current = setInterval(() => {
            void fetchData();
        }, 10000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchData]);

    if (!isConnected) {
        return (
            <div className="stats-panel loading-panel">
                <div className="loading-spinner" />
                <p className="loading-text">Connecting to OPNet {networkId}...</p>
            </div>
        );
    }

    return (
        <div className="stats-panel">
            <div className="stats-header">
                <h2 className="panel-title">
                    <span className="panel-icon">&#x26A1;</span>
                    Network Overview
                </h2>
                {lastUpdate > 0 && (
                    <span className="last-update">
                        Updated {timeAgo(Math.floor(lastUpdate / 1000))}
                    </span>
                )}
            </div>

            <div className="stats-grid-main">
                <div className={`stat-card-lg ${pulseBlock ? 'pulse' : ''}`}>
                    <span className="stat-label">Block Height</span>
                    <span className="stat-value-lg">
                        {blockHeight !== null ? `#${formatBigInt(blockHeight)}` : '---'}
                    </span>
                    {latestBlock && (
                        <span className="stat-sub">{timeAgo(latestBlock.time)}</span>
                    )}
                </div>

                <div className="stat-card-lg">
                    <span className="stat-label">Gas Price</span>
                    <span className="stat-value-lg">
                        {gasData ? formatBigInt(gasData.baseGas) : '---'}
                    </span>
                    <span className="stat-sub">base gas</span>
                </div>

                <div className="stat-card-lg">
                    <span className="stat-label">Gas / Sat</span>
                    <span className="stat-value-lg">
                        {gasData ? formatBigInt(gasData.gasPerSat) : '---'}
                    </span>
                    <span className="stat-sub">gas per satoshi</span>
                </div>

                <div className="stat-card-lg fee-card">
                    <span className="stat-label">BTC Fees (sat/vB)</span>
                    {gasData ? (
                        <div className="fee-tiers">
                            <div className="fee-tier">
                                <span className="fee-label">Low</span>
                                <span className="fee-value low">
                                    {gasData.bitcoin.recommended.low}
                                </span>
                            </div>
                            <div className="fee-tier">
                                <span className="fee-label">Med</span>
                                <span className="fee-value med">
                                    {gasData.bitcoin.recommended.medium}
                                </span>
                            </div>
                            <div className="fee-tier">
                                <span className="fee-label">High</span>
                                <span className="fee-value high">
                                    {gasData.bitcoin.recommended.high}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <span className="stat-value-lg">---</span>
                    )}
                </div>
            </div>

            {latestBlock && (
                <div className="latest-block-detail">
                    <h3 className="sub-panel-title">Latest Block</h3>
                    <div className="block-detail-grid">
                        <div className="block-detail-item">
                            <span className="detail-label">Hash</span>
                            <span className="detail-value mono">
                                {latestBlock.hash.slice(0, 16)}...{latestBlock.hash.slice(-8)}
                            </span>
                        </div>
                        <div className="block-detail-item">
                            <span className="detail-label">Transactions</span>
                            <span className="detail-value">{latestBlock.txCount}</span>
                        </div>
                        <div className="block-detail-item">
                            <span className="detail-label">Gas Used</span>
                            <span className="detail-value">
                                {formatBigInt(latestBlock.gasUsed)}
                            </span>
                        </div>
                        <div className="block-detail-item">
                            <span className="detail-label">Size</span>
                            <span className="detail-value">
                                {(latestBlock.size / 1024).toFixed(1)} KB
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {recentBlocks.length > 0 && (
                <div className="recent-blocks">
                    <h3 className="sub-panel-title">Recent Blocks</h3>
                    <div className="blocks-feed">
                        {recentBlocks.map((block) => (
                            <div key={block.hash} className="block-chip">
                                <span className="block-chip-height">
                                    #{block.height.toString()}
                                </span>
                                <span className="block-chip-txs">
                                    {block.txCount} txs
                                </span>
                                <span className="block-chip-time">{timeAgo(block.time)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {gasData && (
                <div className="gas-meter">
                    <h3 className="sub-panel-title">Gas Utilization</h3>
                    <div className="meter-bar">
                        <div
                            className="meter-fill"
                            style={{
                                width: `${gasData.targetGasLimit > 0n ? Math.min(100, Number((gasData.gasUsed * 100n) / gasData.targetGasLimit)) : 0}%`,
                            }}
                        />
                    </div>
                    <div className="meter-labels">
                        <span>{formatBigInt(gasData.gasUsed)} used</span>
                        <span>{formatBigInt(gasData.targetGasLimit)} limit</span>
                    </div>
                </div>
            )}
        </div>
    );
}
