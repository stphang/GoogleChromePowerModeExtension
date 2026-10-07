const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_PREFERENCES,
  PET_CATALOG,
  loadPreferences,
  normalizePreferences,
  savePreferences,
} = require('../src/preferences.js');

function makeStorage(initial) {
  let value = initial;
  return {
    get: async (defaults) => defaults === null ? value : { ...defaults, ...value },
    set: async (next) => { value = next; },
    read: () => value,
  };
}

test('loads defaults and persists only valid preference changes', async () => {
  const storage = makeStorage({});
  assert.deepEqual(await loadPreferences(storage), DEFAULT_PREFERENCES);

  assert.deepEqual(await savePreferences(storage, { petMode: 'octopus' }), {
    powerMode: true,
    petMode: 'octopus',
    selectedPets: ['octopus'],
  });
  assert.deepEqual(await savePreferences(storage, { powerMode: false }), {
    powerMode: false,
    petMode: 'octopus',
    selectedPets: ['octopus'],
  });
  assert.deepEqual(await savePreferences(storage, { petMode: 'remote-script-value' }), {
    powerMode: false,
    petMode: 'all',
    selectedPets: [...DEFAULT_PREFERENCES.selectedPets],
  });
  assert.deepEqual(storage.read(), {
    powerMode: false,
    petMode: 'all',
    selectedPets: [...DEFAULT_PREFERENCES.selectedPets],
  });
});

test('offers six distinct selectable pets and normalizes saved custom rosters', async () => {
  assert.equal(PET_CATALOG.length, 6);
  assert.equal(new Set(PET_CATALOG.map((pet) => pet.id)).size, 6);
  assert.ok(PET_CATALOG.some((pet) => pet.id === 'goldfish' && pet.name === 'Goldfish'));
  assert.ok(PET_CATALOG.some((pet) => pet.id === 'anglerfish' && pet.name === 'Anglerfish'));
  assert.ok(PET_CATALOG.some((pet) => pet.id === 'crab' && pet.name === 'Big Crab'));
  assert.ok(PET_CATALOG.some((pet) => pet.id === 'sea-turtle' && pet.name === 'Sea Turtle'));
  assert.equal(PET_CATALOG.some(({ id }) => id === 'puddle' || id === 'sprout'), false);
  assert.equal(PET_CATALOG.some(({ id }) => id === 'lumen' || id === 'taro'), false);
  const storage = makeStorage({});
  assert.deepEqual(await loadPreferences(storage), DEFAULT_PREFERENCES);

  assert.deepEqual(await savePreferences(storage, { selectedPets: ['crab', 'goldfish', 'crab', 'unknown'] }), {
    powerMode: true,
    petMode: 'custom',
    selectedPets: ['goldfish', 'crab'],
  });
  assert.deepEqual(normalizePreferences({ petMode: 'octopus' }), {
    powerMode: true,
    petMode: 'octopus',
    selectedPets: ['octopus'],
  });
  assert.deepEqual(normalizePreferences({ petMode: 'off' }), {
    powerMode: true,
    petMode: 'off',
    selectedPets: [],
  });
});

test('migrates saved Corgi selections and presets to Goldfish', async () => {
  assert.deepEqual(normalizePreferences({
    powerMode: true,
    petMode: 'corgis',
    selectedPets: ['corgi'],
  }), {
    powerMode: true,
    petMode: 'goldfish',
    selectedPets: ['goldfish'],
  });
  assert.deepEqual(normalizePreferences({
    petMode: 'corgis-kitties',
    selectedPets: ['corgi', 'kitty'],
  }), {
    powerMode: true,
    petMode: 'goldfish-anglerfish',
    selectedPets: ['goldfish', 'anglerfish'],
  });
  assert.deepEqual(await savePreferences(makeStorage({}), { petMode: 'corgis' }), {
    powerMode: true,
    petMode: 'goldfish',
    selectedPets: ['goldfish'],
  });
});

test('migrates replaced pet selections to their new ocean roster entries', async () => {
  assert.deepEqual(normalizePreferences({
    petMode: 'goldfish-kitties',
    selectedPets: ['goldfish', 'kitty'],
  }), {
    powerMode: true,
    petMode: 'goldfish-anglerfish',
    selectedPets: ['goldfish', 'anglerfish'],
  });
  assert.deepEqual(normalizePreferences({
    petMode: 'custom',
    selectedPets: ['kitty', 'momo', 'kumo', 'puddle', 'sprout', 'lumen', 'taro'],
  }), {
    powerMode: true,
    petMode: 'custom',
    selectedPets: ['anglerfish', 'crab', 'sea-turtle'],
  });
  assert.deepEqual(await savePreferences(makeStorage({}), { petMode: 'kitties' }), {
    powerMode: true,
    petMode: 'anglerfish',
    selectedPets: ['anglerfish'],
  });
});

test('migrates previous preset-only preferences to the matching pet selection', async () => {
  const storage = makeStorage({ powerMode: false, petMode: 'octopus' });
  assert.deepEqual(await loadPreferences(storage), {
    powerMode: false,
    petMode: 'octopus',
    selectedPets: ['octopus'],
  });
});
