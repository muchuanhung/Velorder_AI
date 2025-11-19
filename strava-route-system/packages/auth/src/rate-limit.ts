// Strava API Rate Limit 處理
// Overall: 200 requests/15min, 2000/day
// Read: 100 requests/15min, 1000/day

type RateLimitInfo = {
  limit: number;
  usage: number;
  resetTime: number;
};

type RateLimitHeaders = {
  'X-RateLimit-Limit'?: string;
  'X-RateLimit-Usage'?: string;
  'X-RateLimit-ResetTime'?: string;
};

export function parseRateLimitHeaders(headers: Headers): {
  overall: RateLimitInfo | null;
  read: RateLimitInfo | null;
} {
  const overallLimit = headers.get('X-RateLimit-Limit');
  const overallUsage = headers.get('X-RateLimit-Usage');
  const overallReset = headers.get('X-RateLimit-ResetTime');

  const readLimit = headers.get('X-RateLimit-Limit-Read');
  const readUsage = headers.get('X-RateLimit-Usage-Read');
  const readReset = headers.get('X-RateLimit-ResetTime-Read');

  return {
    overall: overallLimit && overallUsage && overallReset
      ? {
          limit: parseInt(overallLimit, 10),
          usage: parseInt(overallUsage, 10),
          resetTime: parseInt(overallReset, 10)
        }
      : null,
    read: readLimit && readUsage && readReset
      ? {
          limit: parseInt(readLimit, 10),
          usage: parseInt(readUsage, 10),
          resetTime: parseInt(readReset, 10)
        }
      : null
  };
}

export function checkRateLimit(rateLimit: RateLimitInfo | null): {
  canProceed: boolean;
  remaining: number;
  resetTime: Date | null;
  message?: string;
} {
  if (!rateLimit) {
    return {
      canProceed: true,
      remaining: 0,
      resetTime: null
    };
  }

  const remaining = rateLimit.limit - rateLimit.usage;
  const resetTime = new Date(rateLimit.resetTime * 1000);
  const canProceed = remaining > 0;

  return {
    canProceed,
    remaining,
    resetTime,
    message: canProceed
      ? `剩餘 ${remaining}/${rateLimit.limit} 次請求，將在 ${resetTime.toLocaleString('zh-TW')} 重置`
      : `已達 rate limit (${rateLimit.limit})，將在 ${resetTime.toLocaleString('zh-TW')} 重置`
  };
}

export function logRateLimit(headers: Headers, endpoint: string) {
  const { overall, read } = parseRateLimitHeaders(headers);

  console.log(`📊 Strava API Rate Limit - ${endpoint}:`, {
    overall: overall
      ? `${overall.usage}/${overall.limit} (重置: ${new Date(overall.resetTime * 1000).toLocaleString('zh-TW')})`
      : 'N/A',
    read: read
      ? `${read.usage}/${read.limit} (重置: ${new Date(read.resetTime * 1000).toLocaleString('zh-TW')})`
      : 'N/A'
  });

  if (overall) {
    const overallCheck = checkRateLimit(overall);
    if (!overallCheck.canProceed) {
      console.warn('⚠️ Overall rate limit 已達上限！', overallCheck.message);
    }
  }

  if (read) {
    const readCheck = checkRateLimit(read);
    if (!readCheck.canProceed) {
      console.warn('⚠️ Read rate limit 已達上限！', readCheck.message);
    }
  }
}

