(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DeveloperPowerModeCombo = root.DeveloperPowerModeCombo || {};
  Object.assign(root.DeveloperPowerModeCombo, api);
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const PET_CATALOG = Object.freeze([
    { id: 'goldfish', name: 'Goldfish', glyph: '🐠' },
    { id: 'anglerfish', name: 'Anglerfish', glyph: '🐟' },
    { id: 'octopus', name: 'Octopus', glyph: '🐙' },
    { id: 'crab', name: 'Big Crab', glyph: '🦀' },
    { id: 'sea-turtle', name: 'Sea Turtle', glyph: '🐢' },
    { id: 'nori', name: 'Nori · Sea Dragon', glyph: '🐉' },
  ]);
  const PET_IDS = Object.freeze(PET_CATALOG.map((pet) => pet.id));
  const PET_MODES = Object.freeze(['all', 'goldfish-anglerfish', 'goldfish', 'anglerfish', 'octopus', 'off', 'custom']);
  const PET_MODE_ROSTERS = Object.freeze({
    all: PET_IDS,
    'goldfish-anglerfish': ['goldfish', 'anglerfish'],
    goldfish: ['goldfish'],
    anglerfish: ['anglerfish'],
    octopus: ['octopus'],
    off: [],
  });
  const LEGACY_PET_IDS = Object.freeze({
    corgi: 'goldfish',
    kitty: 'anglerfish',
    momo: 'crab',
    kumo: 'sea-turtle',
  });
  const LEGACY_PET_MODES = Object.freeze({
    'corgis-kitties': 'goldfish-anglerfish',
    corgis: 'goldfish',
    'goldfish-kitties': 'goldfish-anglerfish',
    kitties: 'anglerfish',
  });
  const DEFAULT_PREFERENCES = Object.freeze({
    powerMode: true,
    petMode: 'all',
    selectedPets: PET_MODE_ROSTERS.all,
  });

  function normalizePreferences(value) {
    const requestedMode = LEGACY_PET_MODES[value?.petMode] || value?.petMode;
    const petMode = PET_MODES.includes(requestedMode) ? requestedMode : DEFAULT_PREFERENCES.petMode;
    const selectedPets = Array.isArray(value?.selectedPets)
      ? PET_IDS.filter((id) => value.selectedPets.some((selected) =>
        (LEGACY_PET_IDS[selected] || selected) === id))
      : [...(PET_MODE_ROSTERS[petMode] || PET_MODE_ROSTERS.all)];
    return {
      powerMode: typeof value?.powerMode === 'boolean' ? value.powerMode : DEFAULT_PREFERENCES.powerMode,
      petMode,
      selectedPets,
    };
  }

  async function loadPreferences(storage) {
    return normalizePreferences(await storage.get(null));
  }

  async function savePreferences(storage, patch) {
    const current = await loadPreferences(storage);
    const normalizedPatch = { ...patch };
    if (typeof normalizedPatch.petMode === 'string') {
      normalizedPatch.petMode = LEGACY_PET_MODES[normalizedPatch.petMode] || normalizedPatch.petMode;
    }
    const selectedPets = 'selectedPets' in normalizedPatch
      ? normalizedPatch.selectedPets
      : ('petMode' in normalizedPatch && typeof normalizedPatch.petMode === 'string'
        ? PET_MODE_ROSTERS[normalizedPatch.petMode] || PET_MODE_ROSTERS.all
        : current.selectedPets);
    const updated = normalizePreferences({
      ...current,
      ...normalizedPatch,
      selectedPets,
      ...('selectedPets' in normalizedPatch && !('petMode' in normalizedPatch) ? { petMode: 'custom' } : {}),
    });
    await storage.set(updated);
    return updated;
  }

  return { DEFAULT_PREFERENCES, PET_MODES, PET_CATALOG, PET_MODE_ROSTERS, normalizePreferences, loadPreferences, savePreferences };
});
