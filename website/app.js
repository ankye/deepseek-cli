/**
 * DeepSeek CLI — Evidence-First Product Website
 * Client-side interactions: copy buttons, evidence toggle, smooth scroll
 */

(function () {
  'use strict';

  // ============================================
  // Copy Button Handler
  // ============================================

  function setupCopyButtons() {
    const buttons = document.querySelectorAll('.copy-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        const text = btn.getAttribute('data-copy');
        if (!text) return;

        navigator.clipboard.writeText(text).then(function () {
          const originalText = btn.textContent;
          btn.textContent = '✅';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.textContent = originalText;
            btn.classList.remove('copied');
          }, 2000);
        }).catch(function () {
          // Fallback for older browsers or restricted contexts
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            btn.textContent = '✅';
            btn.classList.add('copied');
            setTimeout(function () {
              btn.textContent = '📋';
              btn.classList.remove('copied');
            }, 2000);
          } catch (err) {
            btn.textContent = '❌';
            setTimeout(function () {
              btn.textContent = '📋';
            }, 1500);
          }
          document.body.removeChild(textarea);
        });
      });
    });
  }

  // ============================================
  // Evidence JSON Link — Add click-to-expand
  // ============================================

  function setupEvidenceLink() {
    const evidenceLink = document.querySelector('a[href="evidence.json"]');
    if (!evidenceLink) return;

    evidenceLink.addEventListener('click', function (e) {
      // Let the browser open the JSON normally (target=_blank)
      // No special handling needed — just ensure it works
    });
  }

  // ============================================
  // Smooth Scroll for anchor links
  // ============================================

  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ============================================
  // Keyboard shortcut: 'e' to open evidence.json
  // ============================================

  function setupKeyboardShortcut() {
    document.addEventListener('keydown', function (e) {
      // Only if not in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'e' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        window.open('evidence.json', '_blank');
      }
    });
  }

  // ============================================
  // Console greeting — evidence-first branding
  // ============================================

  function consoleGreeting() {
    console.log(
      '%c🧠 DeepSeek CLI%c — Evidence-First Product Website',
      'font-size: 1.2rem; font-weight: bold; color: #818cf8;',
      'font-size: 1rem; color: #8888a0;'
    );
    console.log(
      '%cThis page was built using the evidence-first workflow. See website/evidence.json for the full evidence manifest.',
      'color: #666680; font-size: 0.85rem;'
    );
    console.log(
      '%cPress %cE %cto open evidence.json',
      'color: #666680; font-size: 0.85rem;',
      'color: #818cf8; font-weight: bold; font-size: 0.85rem;',
      'color: #666680; font-size: 0.85rem;'
    );
  }

  // ============================================
  // Init
  // ============================================

  function init() {
    setupCopyButtons();
    setupEvidenceLink();
    setupSmoothScroll();
    setupKeyboardShortcut();
    consoleGreeting();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
