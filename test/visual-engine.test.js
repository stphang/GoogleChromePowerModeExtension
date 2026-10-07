const test = require('node:test');
const assert = require('node:assert/strict');
const { createVisualEngine } = require('../src/visual-engine.js');

function makeHarness({ reducedMotion = false, random } = {}) {
  const drawnText = [];
  const drawCalls = [];
  const rectangles = [];
  const pixelFills = [];
  const clipHeights = [];
  const arcs = [];
  let strokes = 0;
  const listeners = new Map();
  const removedListeners = [];
  const scheduled = new Map();
  let nextFrameId = 0;
  const context = new Proxy({
    setTransform: () => {},
    clearRect: () => drawCalls.push('clearRect'),
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    rect: (...rectangle) => clipHeights.push(rectangle[3]),
    clip: () => {},
    fillRect: (...rectangle) => {
      drawCalls.push('fillRect');
      rectangles.push(rectangle);
      pixelFills.push({ rectangle, color: context.fillStyle });
    },
    strokeRect: () => {},
    fillText: (text) => drawnText.push(text),
    translate: () => {},
    moveTo: () => {},
    quadraticCurveTo: () => {},
    stroke: () => { strokes += 1; },
    arc: (...arc) => arcs.push(arc),
    fill: () => {},
  }, {
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });
  const canvas = { style: {}, getContext: () => context };
  const document = {
    hidden: false,
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type) => listeners.delete(type),
  };
  const window = {
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type) => {
      removedListeners.push(type);
      listeners.delete(type);
    },
  };
  const engine = createVisualEngine(canvas, {
    document,
    window,
    reducedMotion,
    random,
    now: () => 0,
    requestAnimationFrame: (callback) => {
      const id = ++nextFrameId;
      scheduled.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => scheduled.delete(id),
  });
  return {
    engine,
    document,
    listeners,
    removedListeners,
    scheduled,
    drawnText,
    drawCalls,
    rectangles,
    pixelFills,
    clipHeights,
    arcs,
    get strokes() { return strokes; },
    tick(time) {
      const entry = scheduled.entries().next().value;
      assert.ok(entry, 'an animation frame is scheduled');
      const [id, callback] = entry;
      scheduled.delete(id);
      callback(time);
    },
  };
}

test('goldfish renders with a rounded body, flowing split tail, dorsal fin, and defined eye', () => {
  const harness = makeHarness({ random: () => 0.25 });
  harness.engine.setPreferences({
    powerMode: true,
    petMode: 'custom',
    selectedPets: ['goldfish'],
  });

  const colors = new Set(harness.pixelFills.map(({ color }) => color));
  assert.ok(colors.has('#713820'), 'sprite edges use a dark outline');
  assert.ok(colors.has('#ce6228'), 'the fan-shaped tail is a distinct orange');
  assert.ok(colors.has('#f06f32'), 'fins use a bright contrasting orange');
  assert.ok(colors.has('#ffe27a'), 'goldfish scales have a bright highlight');
  assert.ok(colors.has('#fff4d0'), 'goldfish eye has a bright pixel');
  assert.ok(colors.has('#3b2934'), 'the eye has a dark pupil');
  const bodyPixels = harness.pixelFills
    .filter(({ color, rectangle }) => color === '#f3a832' && rectangle[2] === 3 && rectangle[3] === 3);
  const bodyWidth = Math.max(...bodyPixels.map(({ rectangle }) => rectangle[0] + rectangle[2]))
    - Math.min(...bodyPixels.map(({ rectangle }) => rectangle[0]));
  assert.ok(bodyWidth >= 65, 'the rounded body is broad and clearly visible');
  const outlinePixels = harness.pixelFills
    .filter(({ color }) => color === '#713820')
    .map(({ rectangle }) => rectangle);
  const silhouetteWidth = Math.max(...outlinePixels.map(([x, , width]) => x + width))
    - Math.min(...outlinePixels.map(([x]) => x));
  const silhouetteHeight = Math.max(...outlinePixels.map(([, y, , height]) => y + height))
    - Math.min(...outlinePixels.map(([, y]) => y));
  assert.ok(silhouetteWidth >= 100, 'the long flowing tail is clearly separated from the rounded body');
  assert.ok(silhouetteHeight >= 44, 'the dorsal and lower fins give the fish a recognizable profile');
  const tailPixels = harness.pixelFills
    .filter(({ color, rectangle }) => color === '#ce6228' && rectangle[2] === 3 && rectangle[3] === 3)
    .map(({ rectangle }) => rectangle);
  const tailHeight = Math.max(...tailPixels.map(([, y]) => y + 3))
    - Math.min(...tailPixels.map(([, y]) => y));
  assert.ok(tailHeight >= 30, 'the split tail has two broad, flowing lobes');
  harness.engine.destroy();
});

test('anglerfish, Big Crab, and oversized Sea Turtle render their own pixel art', () => {
  const expectedSprites = [
    { type: 'anglerfish', color: '#e99c32', scale: 3 },
    { type: 'crab', color: '#d94a3d', scale: 4 },
    { type: 'sea-turtle', color: '#347f58', scale: 3 },
  ];

  for (const { type, color, scale } of expectedSprites) {
    const harness = makeHarness({ random: () => 0.25 });
    harness.engine.setPreferences({
      powerMode: true,
      petMode: 'custom',
      selectedPets: [type],
    });
    assert.ok(harness.pixelFills.some(({ color: fill, rectangle }) =>
      fill === color && rectangle[2] === scale && rectangle[3] === scale), `${type} body pixels render at ${scale}px`);
    harness.engine.destroy();
  }
});

test('Sea Horse renders with an upright curved body, curled tail, and spotted gold coloring', () => {
  const harness = makeHarness({ random: () => 0.25 });
  harness.engine.setPreferences({
    powerMode: true,
    petMode: 'custom',
    selectedPets: ['seahorse'],
  });

  const colors = new Set(harness.pixelFills.map(({ color }) => color));
  assert.ok(colors.has('#563b32'), 'the sea horse has a deep brown outline');
  assert.ok(colors.has('#e8a83e'), 'the sea horse has a warm golden body');
  assert.ok(colors.has('#fff0b0'), 'the curled underside and snout have pale highlights');
  assert.ok(colors.has('#a8663c'), 'the body has darker spotted markings');
  assert.ok(colors.has('#f4e8bd'), 'the sea horse has a bright eye');
  const spritePixels = harness.pixelFills
    .filter(({ color, rectangle }) => color !== '#563b32' && rectangle[2] === 2 && rectangle[3] === 2)
    .map(({ rectangle }) => rectangle);
  const spriteWidth = Math.max(...spritePixels.map(([x, , width]) => x + width))
    - Math.min(...spritePixels.map(([x]) => x));
  const spriteHeight = Math.max(...spritePixels.map(([, y, , height]) => y + height))
    - Math.min(...spritePixels.map(([, y]) => y));
  assert.ok(spriteHeight > spriteWidth, 'the sea horse has an upright silhouette');
  assert.ok(spriteHeight >= 48, 'the curled tail and raised head define its profile');
  harness.engine.destroy();
});

test('divers swim up from the roaming boundary above half height and leave as it contracts', () => {
  const harness = makeHarness({ random: () => 0.25 });
  harness.engine.setPreferences({ powerMode: true, petMode: 'goldfish', selectedPets: ['goldfish'] });
  let time = 0;
  function advanceFrames(count) {
    for (let frame = 0; frame < count; frame += 1) {
      time += 34;
      harness.tick(time);
    }
  }
  function diverPixels(color) {
    return harness.pixelFills
      .filter(({ color: fill }) => fill === color)
      .map(({ rectangle }) => rectangle);
  }

  assert.equal(harness.engine.getActivityCounts().divers, 0);
  harness.engine.addHit({ combo: 26, x: 24, y: 30 });
  advanceFrames(90);
  assert.ok(harness.clipHeights.at(-1) < 300);
  assert.equal(harness.engine.getActivityCounts().divers, 0, 'divers wait until the roaming boundary passes halfway');

  harness.engine.addHit({ combo: 27, x: 24, y: 30 });
  advanceFrames(30);
  assert.ok(harness.clipHeights.at(-1) > 300);
  assert.equal(harness.engine.getActivityCounts().divers, 3, 'a small group of three divers appears');
  const firstPose = diverPixels('#ffc98a');
  const firstY = diverPixels('#178b9d').reduce((sum, [x, y]) => sum + y, 0) / diverPixels('#178b9d').length;
  assert.ok(firstPose.length > 0, 'divers render animated arms and legs');
  harness.pixelFills.length = 0;
  advanceFrames(30);
  const nextPose = diverPixels('#ffc98a');
  const nextY = diverPixels('#178b9d').reduce((sum, [x, y]) => sum + y, 0) / diverPixels('#178b9d').length;
  assert.notDeepEqual(nextPose, firstPose, 'divers move their hands and legs while swimming');
  assert.ok(nextY < firstY, 'divers swim upward from the bottom of the roaming area');

  harness.engine.resetCombo();
  advanceFrames(80);
  assert.ok(harness.clipHeights.at(-1) < 300);
  assert.equal(harness.engine.getActivityCounts().divers, 0, 'divers leave as the area contracts below half height');
  harness.engine.destroy();
});

test('Sea Turtle renders a green shell and animated swimming flippers', () => {
  const harness = makeHarness({ random: () => 0.25 });
  harness.engine.setPreferences({
    powerMode: true,
    petMode: 'custom',
    selectedPets: ['sea-turtle'],
  });

  const expectedColors = new Set(harness.pixelFills.map(({ color }) => color));
  assert.ok(expectedColors.has('#347f58'), 'the turtle has a deep green shell');
  assert.ok(expectedColors.has('#66b84a'), 'the head is a brighter green than the shell');
  assert.ok(expectedColors.has('#3f7f39'), 'shell scutes have their own green shade');
  assert.ok(expectedColors.has('#9cdf69'), 'the flippers have bright swimming highlights');
  assert.ok(expectedColors.has('#82c94f'), 'the near flipper has a brighter green');
  assert.ok(expectedColors.has('#74b83f'), 'the far flipper has a darker green');
  assert.ok(expectedColors.has('#d6e58b'), 'the underside has a pale yellow-green belly');
  assert.ok(expectedColors.has('#143b2c'), 'the turtle has a dark shell outline');
  assert.ok(expectedColors.has('#fff4a8'), 'the turtle has a bright eye');

  const shellPixels = harness.pixelFills
    .filter(({ color }) => color === '#347f58')
    .map(({ rectangle }) => rectangle);
  const shellWidth = Math.max(...shellPixels.map(([x, , width]) => x + width))
    - Math.min(...shellPixels.map(([x]) => x));
  const headPixels = harness.pixelFills.filter(({ color }) => color === '#66b84a');
  const headCenterX = headPixels.reduce((sum, { rectangle: [x, , width] }) => sum + x + width / 2, 0) / headPixels.length;
  const shellCenterX = shellPixels.reduce((sum, [x, , width]) => sum + x + width / 2, 0) / shellPixels.length;
  assert.ok(shellWidth >= 45, 'the domed shell is broad compared with the head');
  assert.ok(headCenterX > shellCenterX, 'the head projects forward from the right side of the shell');

  function relativeFinOffset() {
    const fins = harness.pixelFills.filter(({ color }) => color === '#9cdf69');
    const shell = harness.pixelFills.filter(({ color }) => color === '#347f58');
    assert.ok(fins.length > 0, 'the swimming flipper pixels are rendered');
    const center = (pixels) => pixels.reduce((sum, { rectangle: [x, y] }) => ({
      x: sum.x + x / pixels.length,
      y: sum.y + y / pixels.length,
    }), { x: 0, y: 0 });
    const finCenter = center(fins);
    const shellCenter = center(shell);
    return { x: finCenter.x - shellCenter.x, y: finCenter.y - shellCenter.y };
  }

  const firstPose = relativeFinOffset();
  harness.pixelFills.length = 0;
  harness.tick(500);
  const secondPose = relativeFinOffset();
  assert.ok(
    Math.hypot(secondPose.x - firstPose.x, secondPose.y - firstPose.y) >= 2,
    `flippers change pose as the turtle swims (${firstPose.x}, ${firstPose.y} -> ${secondPose.x}, ${secondPose.y})`,
  );
  harness.engine.destroy();
});

test('reduced motion shows an updating static counter without animated effects', () => {
  const harness = makeHarness({ reducedMotion: true });
  harness.engine.setPreferences({ powerMode: true, petMode: 'all' });
  harness.drawCalls.length = 0;
  harness.engine.addHit({ combo: 3, x: 90, y: 400 });

  assert.ok(harness.drawnText.includes('COMBO 03'));
  assert.equal(harness.scheduled.size, 0);
  assert.equal(harness.drawCalls.filter((call) => call === 'fillRect').length, 1);
  harness.engine.destroy();
});

test('ambient animation runs on idle pages, caps rendering, and pauses while hidden', () => {
  const harness = makeHarness();
  harness.engine.setPreferences({ powerMode: false, petMode: 'goldfish' });
  assert.equal(harness.scheduled.size, 1);

  harness.tick(40);
  assert.equal(harness.scheduled.size, 1);
  const renderCount = harness.drawCalls.filter((call) => call === 'clearRect').length;
  harness.tick(56);
  assert.equal(harness.drawCalls.filter((call) => call === 'clearRect').length, renderCount);
  harness.tick(74);
  assert.equal(harness.drawCalls.filter((call) => call === 'clearRect').length, renderCount + 1);
  harness.tick(91);
  assert.equal(harness.drawCalls.filter((call) => call === 'clearRect').length, renderCount + 1);

  harness.document.hidden = true;
  harness.listeners.get('visibilitychange')();
  assert.equal(harness.scheduled.size, 0);
  harness.document.hidden = false;
  harness.listeners.get('visibilitychange')();
  assert.equal(harness.scheduled.size, 1);
  harness.engine.destroy();
});

test('pet movement accelerates with the typing combo and slows after a reset', () => {
  const harness = makeHarness({ random: () => 0.25 });
  harness.engine.setPreferences({ powerMode: true, petMode: 'goldfish', selectedPets: ['goldfish'] });

  function petXPositions() {
    return harness.rectangles
      .filter(([, , width, height]) => width === 3 && height === 3)
      .map(([x]) => x);
  }
  let time = 0;
  function moveForOneSecond() {
    const positionsBefore = petXPositions();
    assert.ok(positionsBefore.length > 0);
    const startX = Math.min(...positionsBefore);
    harness.rectangles.length = 0;
    for (let frame = 0; frame < 31; frame += 1) {
      time += 34;
      harness.tick(time);
    }
    const positionsAfter = petXPositions();
    assert.ok(positionsAfter.length > 0);
    return startX - Math.min(...positionsAfter);
  }

  const baseMovement = moveForOneSecond();
  harness.engine.addHit({ combo: 20, x: 24, y: 30 });
  const acceleratedMovement = moveForOneSecond();
  assert.ok(acceleratedMovement > baseMovement * 1.8, `combo pets accelerate: ${baseMovement} to ${acceleratedMovement}`);

  harness.engine.resetCombo();
  const resetMovement = moveForOneSecond();
  assert.ok(Math.abs(resetMovement - baseMovement) < 4, `pets return to base speed after reset: ${baseMovement} to ${resetMovement}`);
  harness.engine.destroy();
});

test('combo grows the roaming area to the page and the idle reset contracts it to 60px', () => {
  const harness = makeHarness({ random: () => 0.25 });
  harness.engine.setPreferences({ powerMode: true, petMode: 'goldfish', selectedPets: ['goldfish'] });
  const currentHeight = () => harness.clipHeights.at(-1);
  let time = 0;
  function advanceFrames(count) {
    for (let frame = 0; frame < count; frame += 1) {
      time += 34;
      harness.tick(time);
    }
  }
  function petPixelYs() {
    return harness.rectangles
      .filter(([, , width, pixelHeight]) => width === 3 && pixelHeight === 3)
      .map(([, y]) => y);
  }

  assert.equal(currentHeight(), 60);
  harness.engine.addHit({ combo: 30, x: 24, y: 30 });
  advanceFrames(120);
  assert.ok(currentHeight() > 300 && currentHeight() < 600, `combo expands partway: ${currentHeight()}`);
  const petYsAfterExpansion = petPixelYs();
  assert.ok(petYsAfterExpansion.length > 0);
  const priorPetBottom = petYsAfterExpansion.reduce((bottom, y) => Math.max(bottom, y), -Infinity);
  assert.ok(priorPetBottom < currentHeight(), 'pets remain inside the expanded roaming area');
  harness.rectangles.length = 0;
  advanceFrames(12);
  const movedPetBottom = petPixelYs().reduce((bottom, y) => Math.max(bottom, y), -Infinity);
  assert.ok(Math.abs(movedPetBottom - priorPetBottom) > 2, `pets move vertically within the expanded area: ${priorPetBottom} to ${movedPetBottom}`);

  harness.engine.addHit({ combo: 60, x: 24, y: 30 });
  advanceFrames(180);
  assert.equal(currentHeight(), 600);

  harness.engine.resetCombo();
  advanceFrames(100);
  assert.ok(currentHeight() > 60 && currentHeight() < 600, `roaming area contracts smoothly: ${currentHeight()}`);
  advanceFrames(150);
  assert.equal(currentHeight(), 60);
  harness.engine.destroy();
});

test('a pixel whale and water splashes appear above one-third page height and leave below it', () => {
  const harness = makeHarness({ random: () => 0.25 });
  harness.engine.setPreferences({ powerMode: true, petMode: 'goldfish', selectedPets: ['goldfish'] });
  let time = 0;
  function advanceFrames(count) {
    for (let frame = 0; frame < count; frame += 1) {
      time += 34;
      harness.tick(time);
    }
  }

  assert.deepEqual(harness.engine.getActivityCounts(), {
    pets: 6,
    schoolFish: 0,
    divers: 0,
    inkBlots: 0,
    typingParticles: 0,
    whale: false,
    whaleShark: false,
    blueWhale: false,
    splashDroplets: 0,
  });
  harness.engine.addHit({ combo: 30, x: 24, y: 30 });
  advanceFrames(40);
  const whaleCounts = harness.engine.getActivityCounts();
  assert.ok(harness.clipHeights.at(-1) > 200);
  assert.equal(whaleCounts.whale, true);
  assert.equal(whaleCounts.whaleShark, true, 'whale shark joins above one-third page height');
  assert.equal(whaleCounts.blueWhale, false, 'blue whale waits until half the page height');
  assert.ok(whaleCounts.splashDroplets > 0);
  assert.ok(harness.rectangles.filter(([, , width, height]) => width === 5 && height === 5).length > 100);
  assert.ok(harness.arcs.length > 0 && harness.strokes > 0, 'whale spray and surface splashes render on canvas');
  assert.ok(harness.pixelFills.some(({ color, rectangle }) =>
    color === '#276b82' && rectangle[2] === 4 && rectangle[3] === 4), 'whale shark renders spotted 4px pixels');
  assert.ok(harness.pixelFills.some(({ color, rectangle }) =>
    color === '#c7e7de' && rectangle[2] === 4 && rectangle[3] === 4), 'whale shark spots are individually highlighted');

  harness.engine.addHit({ combo: 60, x: 24, y: 30 });
  advanceFrames(180);
  assert.equal(harness.clipHeights.at(-1), 600);
  assert.equal(harness.engine.getActivityCounts().blueWhale, true, 'large blue whale joins above half page height');
  assert.ok(harness.pixelFills.some(({ color, rectangle }) =>
    color === '#287fc1' && rectangle[2] === 6 && rectangle[3] === 6), 'blue whale renders with larger 6px pixels');

  harness.engine.resetCombo();
  advanceFrames(40);
  assert.ok(harness.clipHeights.at(-1) > 300, 'large visitors remain as the area contracts');
  assert.equal(harness.engine.getActivityCounts().blueWhale, true);
  advanceFrames(70);
  assert.ok(harness.clipHeights.at(-1) < 300 && harness.clipHeights.at(-1) > 200);
  assert.equal(harness.engine.getActivityCounts().blueWhale, false, 'blue whale leaves below half page height');
  assert.equal(harness.engine.getActivityCounts().whaleShark, true, 'whale shark remains above one-third page height');
  advanceFrames(70);
  const contractedCounts = harness.engine.getActivityCounts();
  assert.ok(harness.clipHeights.at(-1) < 200);
  assert.equal(contractedCounts.whale, false);
  assert.equal(contractedCounts.whaleShark, false);
  assert.equal(contractedCounts.blueWhale, false);
  assert.equal(contractedCounts.splashDroplets, 0);
  harness.rectangles.length = 0;
  assert.equal(harness.rectangles.filter(([, , width, height]) => width === 5 && height === 5).length, 0);
  harness.engine.destroy();
});

test('cursor-following fish school streams in above 70% roaming height and leaves as it contracts', () => {
  const harness = makeHarness({ random: () => 0.25 });
  harness.engine.setPreferences({ powerMode: true, petMode: 'goldfish', selectedPets: ['goldfish'] });
  const currentHeight = () => harness.clipHeights.at(-1);
  let time = 0;
  function advanceFrames(count) {
    for (let frame = 0; frame < count; frame += 1) {
      time += 34;
      harness.tick(time);
    }
  }
  function recentSchoolPosition() {
    const bodyPixels = harness.pixelFills
      .filter(({ color, rectangle }) => color === '#ffa63b' && rectangle[2] === 6 && rectangle[3] === 4)
      .slice(-200);
    assert.equal(bodyPixels.length, 200, 'all school fish are rendered');
    return {
      x: bodyPixels.reduce((total, { rectangle }) => total + rectangle[0] + rectangle[2] / 2, 0) / 200,
      y: bodyPixels.reduce((total, { rectangle }) => total + rectangle[1] + rectangle[3] / 2, 0) / 200,
    };
  }

  assert.equal(harness.engine.getActivityCounts().schoolFish, 0);
  harness.listeners.get('pointermove')({ clientX: 700, clientY: 180 });
  harness.engine.addHit({ combo: 40, x: 24, y: 30 });
  advanceFrames(120);
  assert.equal(currentHeight(), 420, 'fish wait at exactly 70% roaming height');
  assert.equal(harness.engine.getActivityCounts().schoolFish, 0);

  harness.engine.addHit({ combo: 41, x: 24, y: 30 });
  advanceFrames(4);
  assert.ok(currentHeight() > 420);
  assert.ok(harness.engine.getActivityCounts().schoolFish > 0, 'fish stream in after the threshold is crossed');
  assert.ok(harness.engine.getActivityCounts().schoolFish < 200, 'fish enter gradually from the upper-left');

  advanceFrames(150);
  assert.equal(harness.engine.getActivityCounts().schoolFish, 200, 'the fish school stops at its hard cap');
  const positionBeforeCursorMove = recentSchoolPosition();
  harness.listeners.get('pointermove')({ clientX: 250, clientY: 380 });
  advanceFrames(60);
  const positionAfterCursorMove = recentSchoolPosition();
  assert.ok(
    positionAfterCursorMove.x < positionBeforeCursorMove.x - 100,
    `the school follows the cursor horizontally (${positionBeforeCursorMove.x} -> ${positionAfterCursorMove.x})`,
  );
  assert.ok(
    positionAfterCursorMove.y > positionBeforeCursorMove.y + 80,
    `the school follows the cursor vertically (${positionBeforeCursorMove.y} -> ${positionAfterCursorMove.y})`,
  );

  harness.engine.resetCombo();
  advanceFrames(4);
  assert.ok(currentHeight() <= 420, 'the roaming area contracts back below the activation threshold');
  assert.equal(harness.engine.getActivityCounts().schoolFish, 0, 'the school disappears as the roaming area contracts');
  harness.engine.destroy();
  assert.ok(harness.removedListeners.includes('pointermove'), 'cursor tracking is removed when the engine is destroyed');
});

test('cursor-following fish remain absent when the selected pet roster is off', () => {
  const harness = makeHarness({ random: () => 0.25 });
  harness.engine.setPreferences({ powerMode: true, petMode: 'off', selectedPets: [] });
  harness.engine.addHit({ combo: 60, x: 24, y: 30 });
  for (let frame = 0; frame < 180 && harness.scheduled.size > 0; frame += 1) {
    harness.tick(34 + frame * 34);
  }
  assert.equal(harness.clipHeights.at(-1), 600);
  assert.equal(harness.engine.getActivityCounts().schoolFish, 0);
  harness.engine.destroy();
});

test('only selected pet types are active and an empty roster turns pets off', () => {
  const harness = makeHarness({ random: () => 0.8 });
  harness.engine.setPreferences({
    powerMode: true,
    petMode: 'custom',
    selectedPets: ['seahorse'],
  });
  assert.equal(harness.engine.getActivityCounts().pets, 6);
  harness.engine.setPreferences({
    powerMode: true,
    petMode: 'custom',
    selectedPets: [],
  });
  assert.equal(harness.engine.getActivityCounts().pets, 0);
  assert.equal(harness.scheduled.size, 0);
  harness.engine.destroy();
});

test('the individually selected octopus swims and releases its ink clouds', () => {
  const harness = makeHarness({ random: () => 0.25 });
  harness.engine.setPreferences({
    powerMode: true,
    petMode: 'custom',
    selectedPets: ['octopus'],
  });
  assert.equal(harness.engine.getActivityCounts().pets, 6);
  const octopusColors = new Set(harness.pixelFills.map(({ color }) => color));
  assert.ok(octopusColors.has('#571d72'), 'octopus body has a dark pixel-art outline');
  assert.ok(octopusColors.has('#f2a7ff'), 'octopus mantle catches a bright highlight');
  for (let frame = 0; frame < 100; frame += 1) harness.tick(40 + frame * 33);
  const counts = harness.engine.getActivityCounts();
  assert.ok(counts.inkBlots > 0);
  assert.ok(counts.inkBlots <= 24);
  harness.engine.destroy();
});

test('keeps pets, ink clouds, and typing particles within their activity limits', () => {
  const harness = makeHarness();
  harness.engine.setPreferences({ powerMode: true, petMode: 'all' });
  for (let combo = 1; combo <= 200; combo += 1) {
    harness.engine.addHit({ combo, x: 40, y: 200 });
  }
  let counts = harness.engine.getActivityCounts();
  assert.equal(counts.pets, 6);
  assert.equal(counts.typingParticles, 150);

  harness.engine.setPreferences({ powerMode: false, petMode: 'octopus' });
  for (let frame = 0; frame < 500; frame += 1) harness.tick(40 + frame * 33);
  counts = harness.engine.getActivityCounts();
  assert.equal(counts.pets, 6);
  assert.ok(counts.inkBlots > 0);
  assert.ok(counts.inkBlots <= 24);
  assert.equal(counts.typingParticles, 0);
  harness.engine.destroy();
});
