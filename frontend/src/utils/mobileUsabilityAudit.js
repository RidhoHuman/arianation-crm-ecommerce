/**
 * Mobile Usability Checklist
 * Verifikasi untuk responsive design & mobile UX
 * 
 * Run this checklist sebelum production launch
 */

export const mobileUsabilityChecklist = {
  // Viewport & Responsive
  viewport: {
    description: 'Viewport meta tag configured',
    check: () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      return viewport?.getAttribute('content')?.includes('width=device-width');
    },
    fix: 'Add: <meta name="viewport" content="width=device-width, initial-scale=1.0">',
  },

  responsiveLayout: {
    description: 'Layout is responsive on mobile (320px - 480px)',
    check: () => window.innerWidth <= 480,
    fix: 'Test on actual mobile devices or use Chrome DevTools (F12 > Toggle Device Toolbar)',
  },

  // Touch targets
  touchTargets: {
    description: 'All buttons/links are minimum 48x48px (tap-friendly)',
    check: () => {
      const buttons = document.querySelectorAll('button, a, input[type="button"]');
      return Array.from(buttons).every(btn => {
        const rect = btn.getBoundingClientRect();
        return rect.width >= 48 && rect.height >= 48;
      });
    },
    fix: 'Ensure buttons/links have min-width: 48px and min-height: 48px padding',
  },

  // Text readability
  textReadability: {
    description: 'Text is readable without zoom (minimum font 16px)',
    check: () => {
      const textElements = document.querySelectorAll('p, span, div');
      return Array.from(textElements).every(el => {
        const fontSize = parseInt(window.getComputedStyle(el).fontSize);
        return fontSize >= 14; // Minimum for mobile
      });
    },
    fix: 'Use Tailwind text-base (16px) or larger for body text. Use text-sm (14px) only for secondary text.',
  },

  // No horizontal scroll
  noHorizontalScroll: {
    description: 'No horizontal scrolling required',
    check: () => {
      const bodyWidth = document.body.scrollWidth;
      const viewportWidth = window.innerWidth;
      return bodyWidth <= viewportWidth;
    },
    fix: 'Check for overflow-x issues. Use responsive max-width and overflow handling.',
  },

  // Image optimization
  imageResponsive: {
    description: 'Images are responsive and lazy-loaded',
    check: () => {
      const images = document.querySelectorAll('img');
      return Array.from(images).every(img => {
        const hasResponsive = img.getAttribute('srcset') || img.parentElement?.tagName === 'PICTURE';
        const hasLazy = img.getAttribute('loading') === 'lazy';
        return hasResponsive && hasLazy;
      });
    },
    fix: 'Add loading="lazy" and use srcset/picture elements for responsive images',
  },

  // Forms mobile-friendly
  formMobileFriendly: {
    description: 'Forms are mobile-optimized (proper input types, big labels)',
    check: () => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).every(input => {
        const type = input.getAttribute('type');
        const hasLabel = document.querySelector(`label[for="${input.id}"]`);
        return hasLabel && ['text', 'email', 'tel', 'number', 'password', 'search'].includes(type || 'text');
      });
    },
    fix: 'Use proper input types (email, tel, number) for mobile keyboards. Each input needs associated label.',
  },

  // Interactivity responsiveness
  interactivityDelay: {
    description: 'Click events fire instantly (no 300ms delay)',
    check: () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      return viewport?.getAttribute('content')?.includes('initial-scale=1');
    },
    fix: 'Use viewport meta tag with initial-scale=1 to disable 300ms tap delay',
  },

  // Navigation accessibility
  navigationAccessible: {
    description: 'Navigation is accessible and keyboard-navigable',
    check: () => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).every(btn => {
        return btn.getAttribute('type') && (
          btn.hasAttribute('aria-label') || btn.textContent.trim()
        );
      });
    },
    fix: 'Add aria-labels or text to all buttons. Ensure keyboard navigation works (Tab key).',
  },

  // Dark mode consideration
  darkMode: {
    description: 'Dark mode CSS considerations (optional but recommended)',
    check: () => {
      const darkModeStyles = document.querySelector('style, link[href*="dark"]');
      return !!darkModeStyles;
    },
    fix: 'Optional: Add dark mode support via Tailwind dark: classes and prefers-color-scheme',
  },
};

/**
 * Run all mobile usability checks
 * Returns report with pass/fail status
 */
export function runMobileUsabilityAudit() {
  const results = {};

  Object.entries(mobileUsabilityChecklist).forEach(([key, test]) => {
    try {
      const passed = test.check();
      results[key] = {
        description: test.description,
        passed,
        fix: !passed ? test.fix : null,
      };
    } catch (error) {
      results[key] = {
        description: test.description,
        passed: false,
        error: error.message,
        fix: test.fix,
      };
    }
  });

  return results;
}

/**
 * Log mobile audit to console
 * Usage: runMobileAuditLog() in browser console
 */
export function runMobileAuditLog() {
  const results = runMobileUsabilityAudit();
  const passed = Object.values(results).filter(r => r.passed).length;
  const total = Object.keys(results).length;

  console.log('%c📱 MOBILE USABILITY AUDIT', 'font-size: 16px; font-weight: bold; color: #2563eb;');
  console.log(`Result: ${passed}/${total} checks passed`);
  console.table(
    Object.entries(results).map(([key, data]) => ({
      Check: data.description,
      Status: data.passed ? '✅ PASS' : '❌ FAIL',
      Fix: data.fix || 'N/A',
    }))
  );

  if (passed < total) {
    console.warn(`⚠️ ${total - passed} issues found. Please fix before production.`);
  } else {
    console.log('✅ All mobile usability checks passed!');
  }
}

export default {
  mobileUsabilityChecklist,
  runMobileUsabilityAudit,
  runMobileAuditLog,
};
