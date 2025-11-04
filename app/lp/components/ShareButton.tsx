import { useComposeCast } from '@coinbase/onchainkit/minikit';
import { useMemo } from 'react';
import type { CLPosition } from '../types';

interface ShareButtonProps {
  positions: CLPosition[];
  theme: any;
  darkMode: boolean;
}

export default function ShareButton({ positions, theme, darkMode }: ShareButtonProps) {
  const { composeCastAsync } = useComposeCast();

  const shareData = useMemo(() => {
    const activePositions = positions.filter((p) => p.isActive);
    const stakedPositions = positions.filter((p) => p.isStaked);
    
    const totalDeposited = activePositions.reduce((sum, p) => {
      return sum + parseFloat(p.estimatedValueUSD || '0');
    }, 0);
    
    const totalClaimable = stakedPositions.reduce((sum, p) => {
      return sum + parseFloat(p.earnedAmountUSD || '0');
    }, 0);
    
    const totalEarnedPerYear = stakedPositions.reduce((sum, p) => {
      return sum + parseFloat(p.rewardPerYearUSD || '0');
    }, 0);
    const avgAPR = stakedPositions.length > 0 
      ? totalEarnedPerYear / (totalDeposited * 365.25) * 100 
      : 0;

    return { totalDeposited, totalClaimable, avgAPR, activeCount: activePositions.length };
  }, [positions]);

  const handleShare = async () => {
    const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || process.env.NEXT_PUBLIC_URL || 'https://lping.vercel.app';
    
    // Generate contextual share message based on portfolio stats
    let shareText = '';
    
    if (shareData.totalClaimable > 100) {
      shareText = `💰 Just claimed $${shareData.totalClaimable.toFixed(0)} in LP rewards with @LPing! Tracking my Aerodrome positions has never been easier.`;
    } else if (shareData.avgAPR > 30) {
      shareText = `🚀 Earning ${shareData.avgAPR.toFixed(1)}% APY on my LP positions! Using @LPing to track my Aerodrome rewards.`;
    } else if (shareData.totalDeposited > 10000) {
      shareText = `📊 Managing $${(shareData.totalDeposited / 1000).toFixed(0)}k+ in LP positions. @LPing makes it easy to track rewards and performance.`;
    } else {
      shareText = `📈 Tracking my Aerodrome LP positions with @LPing. Real-time rewards, APR, and portfolio analytics!`;
    }

    try {
      const result = await composeCastAsync({
        text: shareText,
        embeds: [ROOT_URL],
      });

      if (result?.cast) {
        console.log('Cast shared successfully:', result.cast.hash);
      }
    } catch (error) {
      console.error('Error sharing cast:', error);
    }
  };

  if (positions.length === 0) return null;

  return (
    <button
      onClick={handleShare}
      style={{
        padding: '10px 20px',
        borderRadius: 8,
        border: `1px solid ${theme.border}`,
        background: theme.bgCard,
        color: theme.text,
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = theme.bgSecondary;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = theme.bgCard;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      title="Share your portfolio achievements"
    >
      📤 Share Portfolio
    </button>
  );
}

