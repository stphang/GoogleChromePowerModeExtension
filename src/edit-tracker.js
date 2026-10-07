(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DeveloperPowerModeCombo = root.DeveloperPowerModeCombo || {};
  root.DeveloperPowerModeCombo.createEditTracker = api.createEditTracker;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const COMBO_TIMEOUT_MS = 1500;

  function findEditor(target) {
    for (let element = target; element; element = element.parentElement) {
      const tagName = element.tagName;
      if (tagName === 'TEXTAREA') return element;
      if (tagName === 'INPUT') {
        const type = (element.type || 'text').toLowerCase();
        return ['text', 'search', 'url', 'tel', 'email'].includes(type) ? element : null;
      }
      if (element.isContentEditable) {
        let host = element;
        while (host.parentElement && host.parentElement.isContentEditable) host = host.parentElement;
        return host;
      }
    }
    return null;
  }

  function readText(editor) {
    return 'value' in editor ? editor.value : editor.textContent;
  }

  function isTextEditingKey(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing || event.key === 'Process') return false;
    return Array.from(event.key || '').length === 1 || ['Backspace', 'Delete', 'Enter'].includes(event.key);
  }

  function createEditTracker(document, callbacks) {
    let currentEditor = null;
    let combo = 0;
    let pendingKeyEditor = null;
    let composition = null;
    let finishingComposition = null;
    let resetTimer = null;
    let destroyed = false;

    function reset(reason) {
      if (resetTimer !== null) clearTimeout(resetTimer);
      resetTimer = null;
      pendingKeyEditor = null;
      composition = null;
      finishingComposition = null;
      const hadCombo = combo > 0;
      combo = 0;
      if (hadCombo) callbacks.onReset({ reason });
    }

    function selectEditor(editor) {
      if (editor === currentEditor) return;
      if (currentEditor !== null) reset('editor-change');
      currentEditor = editor;
      pendingKeyEditor = null;
      composition = null;
      finishingComposition = null;
    }

    function recordHit(editor) {
      selectEditor(editor);
      combo += 1;
      if (resetTimer !== null) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        resetTimer = null;
        if (combo > 0) {
          combo = 0;
          callbacks.onReset({ reason: 'inactivity' });
        }
      }, COMBO_TIMEOUT_MS);
      callbacks.onHit({ editor, combo });
    }

    function onFocusIn(event) {
      selectEditor(findEditor(event.target));
    }

    function onKeyDown(event) {
      if (!event.isTrusted || event.defaultPrevented) return;
      const editor = findEditor(event.target);
      selectEditor(editor);
      pendingKeyEditor = editor && isTextEditingKey(event) ? editor : null;
    }

    function onInput(event) {
      if (!event.isTrusted) return;
      const editor = findEditor(event.target);
      if (!editor) {
        selectEditor(null);
        return;
      }
      selectEditor(editor);
      if (finishingComposition && finishingComposition.editor === editor) {
        finishingComposition.sawInput = true;
        return;
      }
      if (composition && composition.editor === editor) {
        composition.sawInput = true;
        return;
      }
      if (pendingKeyEditor !== editor) return;
      if (!['insertText', 'insertLineBreak', 'insertParagraph', 'deleteContentBackward', 'deleteContentForward'].includes(event.inputType)) {
        pendingKeyEditor = null;
        return;
      }
      pendingKeyEditor = null;
      recordHit(editor);
    }

    function onCompositionStart(event) {
      if (!event.isTrusted) return;
      const editor = findEditor(event.target);
      if (!editor) return;
      selectEditor(editor);
      pendingKeyEditor = null;
      composition = { editor, before: readText(editor), sawInput: false };
    }

    function onCompositionEnd(event) {
      if (!event.isTrusted || !composition || composition.editor !== findEditor(event.target)) return;
      const endingComposition = composition;
      composition = null;
      finishingComposition = endingComposition;
      setTimeout(() => {
        const isCurrentComposition = finishingComposition === endingComposition && currentEditor === endingComposition.editor;
        if (finishingComposition === endingComposition) finishingComposition = null;
        if (!destroyed && isCurrentComposition && endingComposition.sawInput && readText(endingComposition.editor) !== endingComposition.before) {
          recordHit(endingComposition.editor);
        }
      }, 0);
    }

    const listeners = [
      ['focusin', onFocusIn],
      ['keydown', onKeyDown],
      ['input', onInput],
      ['compositionstart', onCompositionStart],
      ['compositionend', onCompositionEnd],
    ];
    for (const [type, listener] of listeners) document.addEventListener(type, listener, true);

    return {
      reset() {
        reset('manual');
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        for (const [type, listener] of listeners) document.removeEventListener(type, listener, true);
        reset('destroy');
        currentEditor = null;
      },
    };
  }

  return { createEditTracker };
});
