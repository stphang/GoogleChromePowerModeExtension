(function () {
  const {
    DEFAULT_PREFERENCES,
    PET_CATALOG,
    loadPreferences,
    savePreferences,
  } = globalThis.DeveloperPowerModeCombo;
  const powerMode = document.getElementById('power-mode');
  const petMode = document.getElementById('pet-mode');
  const petOptions = document.getElementById('pet-options');
  const status = document.getElementById('status');
  const selectAll = document.getElementById('select-all');
  const selectNone = document.getElementById('select-none');
  let preferences = DEFAULT_PREFERENCES;
  let saving = Promise.resolve();

  function showPreferences(next) {
    preferences = next;
    powerMode.checked = preferences.powerMode;
    petMode.value = preferences.petMode;
    for (const checkbox of petOptions.querySelectorAll('input[type="checkbox"]')) {
      checkbox.checked = preferences.selectedPets.includes(checkbox.dataset.petId);
    }
  }

  function reportError(error) {
    status.textContent = 'Could not save local settings. Please try again.';
    console.error('Developer Power Mode Combo could not persist local preferences.', error);
  }

  function persist(patch) {
    status.textContent = '';
    saving = saving.then(async () => {
      const updated = await savePreferences(chrome.storage.local, patch);
      showPreferences(updated);
    }).catch(reportError);
  }

  powerMode.addEventListener('change', () => persist({ powerMode: powerMode.checked }));
  petMode.addEventListener('change', () => {
    if (petMode.value === 'custom') {
      persist({ petMode: 'custom', selectedPets: preferences.selectedPets });
      return;
    }
    persist({ petMode: petMode.value });
  });

  for (const pet of PET_CATALOG) {
    const label = document.createElement('label');
    label.className = 'pet-option';
    label.title = pet.name;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.petId = pet.id;
    checkbox.setAttribute('aria-label', pet.name);
    const swatch = document.createElement('span');
    swatch.className = `pet-swatch pet-swatch--${pet.id}`;
    swatch.setAttribute('aria-hidden', 'true');
    const glyph = document.createElement('span');
    glyph.className = 'pet-glyph';
    glyph.textContent = pet.glyph;
    const name = document.createElement('span');
    name.className = 'pet-name';
    name.textContent = pet.name;
    label.append(checkbox, swatch, glyph, name);
    petOptions.append(label);
    checkbox.addEventListener('change', () => {
      const selectedPets = [...petOptions.querySelectorAll('input[type="checkbox"]:checked')]
        .map((input) => input.dataset.petId);
      petMode.value = 'custom';
      persist({ selectedPets });
    });
  }

  selectAll.addEventListener('click', () => persist({ petMode: 'all' }));
  selectNone.addEventListener('click', () => persist({ petMode: 'off' }));

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || (!changes.powerMode && !changes.petMode && !changes.selectedPets)) return;
    showPreferences({
      powerMode: changes.powerMode ? changes.powerMode.newValue : preferences.powerMode,
      petMode: changes.petMode ? changes.petMode.newValue : preferences.petMode,
      selectedPets: changes.selectedPets ? changes.selectedPets.newValue : preferences.selectedPets,
    });
  });

  loadPreferences(chrome.storage.local).then(showPreferences).catch(reportError);
})();
