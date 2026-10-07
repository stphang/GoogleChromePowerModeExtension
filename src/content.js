(function () {
  const api = globalThis.DeveloperPowerModeCombo;
  let preferences = api.DEFAULT_PREFERENCES;
  const overlay = api.startOverlayRuntime({ document, window, initialPreferences: preferences });

  function applyPreferences(next) {
    preferences = api.normalizePreferences(next);
    overlay.setPreferences(preferences);
  }

  api.loadPreferences(chrome.storage.local).then(applyPreferences).catch((error) => {
    console.error('Developer Power Mode Combo could not read local preferences.', error);
  });
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || (!changes.powerMode && !changes.petMode && !changes.selectedPets)) return;
    applyPreferences({
      ...preferences,
      powerMode: changes.powerMode ? changes.powerMode.newValue : preferences.powerMode,
      petMode: changes.petMode ? changes.petMode.newValue : preferences.petMode,
      selectedPets: changes.selectedPets ? changes.selectedPets.newValue : preferences.selectedPets,
    });
  });
})();
