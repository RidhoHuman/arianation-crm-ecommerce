/**
 * Core Web Vitals Monitoring & Optimization Guide
 * Track: LCP, FID, CLS - Google's page experience metrics
 */

/**
 * Measure Core Web Vitals using Web Vitals API
 * Requires: npm install web-vitals
 */
export function initWebVitalsTracking() {
  // Check if web-vitals is available
  if (typeof window.webVitals === 'undefined') {
    console.warn('web-vitals library not loaded. Run: npm install web-vitals');
    return;
  }

  const { getCLS, getFID, getFCP, getLCP, getTTFB } = window.webVitals;

  // LCP - Largest Contentful Paint (loading performance)
  // Target: < 2.5s (good), 2.5-4s (needs improvement), > 4s (poor)
  getLCP((metric) => {
    console.log('📊 LCP (Largest Contentful Paint):', {
      value: metric.value.toFixed(0) + 'ms',
      rating: metric.value < 2500 ? '✅ Good' : metric.value < 4000 ? '⚠️ Needs work' : '❌ Poor',
      target: '< 2500ms',
    });
    logToAnalytics('LCP', metric.value);
  });

  // FID - First Input Delay (interactivity)
  // Target: < 100ms (good), 100-300ms (needs improvement), > 300ms (poor)
  getFID((metric) => {
    console.log('📊 FID (First Input Delay):', {
      value: metric.value.toFixed(0) + 'ms',
      rating: metric.value < 100 ? '✅ Good' : metric.value < 300 ? '⚠️ Needs work' : '❌ Poor',
      target: '< 100ms',
    });
    logToAnalytics('FID', metric.value);
  });

  // CLS - Cumulative Layout Shift (visual stability)
  // Target: < 0.1 (good), 0.1-0.25 (needs improvement), > 0.25 (poor)
  getCLS((metric) => {
    console.log('📊 CLS (Cumulative Layout Shift):', {
      value: metric.value.toFixed(3),
      rating: metric.value < 0.1 ? '✅ Good' : metric.value < 0.25 ? '⚠️ Needs work' : '❌ Poor',
      target: '< 0.1',
    });
    logToAnalytics('CLS', metric.value);
  });

  // FCP - First Contentful Paint (perception of load speed)
  getFCP((metric) => {
    console.log('📊 FCP (First Contentful Paint):', {
      value: metric.value.toFixed(0) + 'ms',
      rating: metric.value < 1800 ? '✅ Good' : metric.value < 3000 ? '⚠️ Needs work' : '❌ Poor',
      target: '< 1800ms',
    });
    logToAnalytics('FCP', metric.value);
  });

  // TTFB - Time To First Byte (server response)
  getTTFB((metric) => {
    console.log('📊 TTFB (Time To First Byte):', {
      value: metric.value.toFixed(0) + 'ms',
      rating: metric.value < 600 ? '✅ Good' : metric.value < 1200 ? '⚠️ Needs work' : '❌ Poor',
      target: '< 600ms',
    });
    logToAnalytics('TTFB', metric.value);
  });
}

/**
 * Log metrics to analytics service (Google Analytics, Sentry, etc)
 */
function logToAnalytics(metricName, value) {
  // Google Analytics (if available)
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      metric_name: metricName,
      metric_value: Math.round(value),
    });
  }

  // Sentry (if available)
  if (window.Sentry) {
    window.Sentry.captureMessage(`Web Vital: ${metricName}=${value}`, 'info');
  }
}

/**
 * Core Web Vitals Optimization Checklist
 * Implement these to improve scores
 */
export const webVitalsOptimizationGuide = {
  // LCP Optimization
  LCP_Optimization: {
    metric: 'Largest Contentful Paint',
    target: '< 2.5s',
    improvements: [
      {
        title: 'Eliminate render-blocking resources',
        actions: [
          'Defer non-critical CSS/JS with async/defer attributes',
          'Use dynamic imports for below-fold code',
          'Minimize CSS/JS bundles',
        ],
      },
      {
        title: 'Image optimization',
        actions: [
          'Use responsive images (srcset)',
          'Lazy load images below fold (loading="lazy")',
          'Use WebP format with fallbacks',
          'Compress images (tools: TinyPNG, ImageOptim)',
        ],
      },
      {
        title: 'Reduce server response time (TTFB)',
        actions: [
          'Use CDN for static assets',
          'Enable gzip compression',
          'Optimize database queries',
          'Use caching (Redis, Varnish)',
        ],
      },
      {
        title: 'Avoid large layout shifts when loading images',
        actions: [
          'Set explicit width/height on images',
          'Reserve space for images (aspect-ratio CSS)',
          'Use skeleton loaders for dynamic content',
        ],
      },
    ],
  },

  // FID Optimization
  FID_Optimization: {
    metric: 'First Input Delay',
    target: '< 100ms',
    improvements: [
      {
        title: 'Reduce JavaScript execution',
        actions: [
          'Code splitting - split JS into smaller chunks',
          'Defer non-critical JavaScript',
          'Use web workers for heavy computations',
          'Remove unused dependencies',
        ],
      },
      {
        title: 'Break up long tasks',
        actions: [
          'Split computation into smaller chunks (< 50ms)',
          'Use requestIdleCallback() for low-priority work',
          'Yield to browser for user input',
        ],
      },
      {
        title: 'Third-party script optimization',
        actions: [
          'Load analytics/ads with async/defer',
          'Use facades for third-party embeds',
          'Sandbox third-party scripts',
        ],
      },
    ],
  },

  // CLS Optimization
  CLS_Optimization: {
    metric: 'Cumulative Layout Shift',
    target: '< 0.1',
    improvements: [
      {
        title: 'Reserve space for dynamic content',
        actions: [
          'Set width/height on images (aspect-ratio ratio)',
          'Reserve space for ads before they load',
          'Avoid injecting content above existing content',
        ],
      },
      {
        title: 'Avoid animations that trigger layout',
        actions: [
          'Use transform/opacity instead of top/left',
          'Use will-change CSS sparingly',
          'Test animations in DevTools',
        ],
      },
      {
        title: 'Font loading optimization',
        actions: [
          'Use font-display: swap to avoid FOUT',
          'Preload critical fonts with <link rel="preload">',
          'Avoid web font causing layout shift',
        ],
      },
    ],
  },
};

/**
 * Quick performance checklist (implementasi cepat)
 */
export const quickPerformanceWins = [
  {
    task: 'Enable Gzip compression (backend)',
    effort: '5 min',
    impact: '20-30% size reduction',
    commands: ['app.use(compression()) // Express.js'],
  },
  {
    task: 'Add lazy loading to images',
    effort: '10 min',
    impact: 'LCP improvement',
    code: '<img loading="lazy" src="..." />',
  },
  {
    task: 'Set explicit image dimensions',
    effort: '10 min',
    impact: 'CLS improvement (prevent layout shift)',
    code: '<img width="400" height="300" src="..." />',
  },
  {
    task: 'Code splitting (React components)',
    effort: '15 min',
    impact: 'FID improvement, faster initial load',
    code: 'const Comp = lazy(() => import("./Heavy.jsx"));',
  },
  {
    task: 'Remove unused CSS/JS',
    effort: '20 min',
    impact: 'Bundle size -10-20%',
    tool: 'Chrome DevTools > Coverage tab',
  },
  {
    task: 'Enable browser caching',
    effort: '10 min',
    impact: 'Repeat visitor load time -50%+',
    commands: ['Cache-Control: max-age=31536000, immutable'],
  },
];

/**
 * Performance monitoring React hook
 */
export function useWebVitals() {
  React.useEffect(() => {
    initWebVitalsTracking();
  }, []);

  return {
    logEvent: (name, value) => logToAnalytics(name, value),
  };
}

export default {
  initWebVitalsTracking,
  webVitalsOptimizationGuide,
  quickPerformanceWins,
  useWebVitals,
};
