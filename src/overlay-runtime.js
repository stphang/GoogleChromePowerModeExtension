(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DeveloperPowerModeCombo = root.DeveloperPowerModeCombo || {};
  root.DeveloperPowerModeCombo.startOverlayRuntime = api.startOverlayRuntime;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  function startOverlayRuntime(options) {
    const { document, window } = options;
    const api = globalThis.DeveloperPowerModeCombo;
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;contain:strict;isolation:isolate';
    const shadowRoot = host.attachShadow({ mode: 'closed' });
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100vw;height:100vh;pointer-events:none';
    shadowRoot.appendChild(canvas);
    document.documentElement.appendChild(host);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const engine = api.createVisualEngine(canvas, {
      document,
      window,
      reducedMotion: motionQuery.matches,
      requestAnimationFrame: window.requestAnimationFrame.bind(window),
      cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
      now: () => window.performance.now(),
    });
    let preferences = api.normalizePreferences(options.initialPreferences);

    function getCaretPoint(editor) {
      const bounds = editor.getBoundingClientRect();
      if (editor.tagName === 'INPUT' || editor.tagName === 'TEXTAREA') {
        const measureCanvas = document.createElement('canvas');
        const context = measureCanvas.getContext('2d');
        const style = window.getComputedStyle(editor);
        context.font = style.font;
        const caret = typeof editor.selectionStart === 'number' ? editor.selectionStart : editor.value.length;
        const beforeCaret = editor.value.slice(0, caret);
        const lastLine = beforeCaret.split('\n').pop();
        const padding = Number.parseFloat(style.paddingLeft) || 0;
        const x = bounds.left + padding + context.measureText(lastLine).width - (editor.scrollLeft || 0);
        return { x: Math.max(bounds.left + 2, Math.min(x, bounds.right - 2)), y: bounds.top + bounds.height / 2 };
      }

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0).cloneRange();
        range.collapse(true);
        const caret = range.getBoundingClientRect();
        if (caret.width || caret.height) return { x: caret.left, y: caret.top + caret.height / 2 };
      }
      return { x: bounds.left + 8, y: bounds.top + Math.min(bounds.height / 2, 24) };
    }

    const tracker = api.createEditTracker(document, {
      onHit({ editor, combo }) {
        if (!preferences.powerMode) return;
        engine.addHit({ combo, ...getCaretPoint(editor) });
      },
      onReset() {
        engine.resetCombo();
      },
    });

    function setPreferences(next) {
      const wasEnabled = preferences.powerMode;
      preferences = api.normalizePreferences(next);
      engine.setPreferences(preferences);
      if (wasEnabled !== preferences.powerMode) tracker.reset();
    }

    function onMotionPreferenceChange(event) {
      engine.setReducedMotion(event.matches);
    }
    motionQuery.addEventListener('change', onMotionPreferenceChange);
    engine.setPreferences(preferences);

    return {
      setPreferences,
      destroy() {
        motionQuery.removeEventListener('change', onMotionPreferenceChange);
        tracker.destroy();
        engine.destroy();
        host.remove();
      },
    };
  }

  return { startOverlayRuntime };
});
