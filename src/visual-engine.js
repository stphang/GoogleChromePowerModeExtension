(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DeveloperPowerModeCombo = root.DeveloperPowerModeCombo || {};
  root.DeveloperPowerModeCombo.createVisualEngine = api.createVisualEngine;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const FPS_INTERVAL = 1000 / 30;
  const MAX_PETS = 6;
  const MAX_SCHOOL_FISH = 200;
  const SCHOOL_FISH_SPAWN_RATE = 90;
  const MAX_INK_BLOTS = 24;
  const MAX_WHALE_SPLASH_DROPLETS = 18;
  const MAX_DIVERS = 3;
  const MAX_TYPING_PARTICLES = 150;
  const MIN_ROAMING_HEIGHT = 60;
  const COMBO_TO_FULL_PAGE = 60;
  const ROAMING_EXPANSION_SPEED = 120;
  const ROAMING_CONTRACTION_SPEED = 90;
  const MAX_COMBO_SPEED = 2.5;
  const SPEED_PER_HIT = 0.06;
  const FISH_SCHOOL_THRESHOLD = 0.7;
  const PET_TYPES = Object.freeze([
    'goldfish',
    'anglerfish',
    'octopus',
    'crab',
    'sea-turtle',
    'seahorse',
  ]);

  function centerSpriteRows(rows) {
    const width = Math.max(...rows.map((row) => row.length));
    return rows.map((row) => {
      const leftPadding = Math.floor((width - row.length) / 2);
      return row.padStart(row.length + leftPadding, ' ').padEnd(width, ' ');
    });
  }

  function petScale(type) {
    return PET_SCALES[type] || 3;
  }

  function petHalfWidth(type) {
    const pattern = PETS[type];
    if (!pattern) return 15;
    const width = Math.max(...pattern.map((row) => row.length)) * petScale(type);
    return Math.ceil(width / 2) + 4;
  }

  function petHalfHeight(type) {
    const pattern = PETS[type];
    if (!pattern) return 14;
    return Math.ceil(pattern.length * petScale(type) / 2) + 4;
  }

  const PETS = {
    goldfish: [
      '',
      '                       SS',
      '       SHHSS         SSSSSS',
      '    TTHHTTTT       TTTTHHTTTT',
      '  TTHHTTTTTT      SSSHHSSSSSSSF',
      '   SSSSSSSSS      SHHSSSSSSSSSF',
      '     TTTTTTTT    FFFFFFYYYYYYFFF',
      '        TTTTTT FFFFFFYYYYYYYFFFFFFF',
      '           TTTFFFFYYYYYYYYFFFFFFFFFF',
      '            FFFFFYYYYYYYFFFFFFFFFFWFF',
      '            FFFFFFFFFYYYYYYYYFFFFFBFTT',
      '           TTTFFFFFFFFFFYYYYYYYFFFFF',
      '        TTTTTT FFFFFFYYYYYYYYTFFFFF',
      '     SSSSSSSS    FFFFYYYYYYSSSSFF',
      '   TTHHTTTTT      TTTTTTFFFTTTT',
      '    TTHHTTT      SSSSSSFFFFFF',
      '      SSSS      TTTTTT',
      '                SSSSS',
    ].map((row) => row.padEnd(40)),
    anglerfish: centerSpriteRows([
      '       L       ',
      '       L       ',
      '      LLL      ',
      '     LOOOL     ',
      '   FFFFFFFFF   ',
      '  FFFFFFFFFFF  ',
      ' FFFFFFFFFFFFF ',
      ' FFFWFFFFFFFFFD',
      '  FFFFFFFFFFFDD',
      '   FFFFCFFFFF  ',
      '    FFFFFFFFF  ',
      '     FFFFFFF   ',
      '    RR   RR    ',
    ]),
    crab: centerSpriteRows([
      '  CC         CC ',
      ' CCC         CCC',
      '  CC         CC ',
      '     CCCCC       ',
      '   RRCCCCC RR    ',
      '  RRRCCCCC RRR   ',
      '  RRRRRRRRRRRR   ',
      '  RRRWBRRRWBRRR  ',
      '  RRRRRRRRRRRR   ',
      '   RRRRRRRRRR    ',
      '  RR RRRRRR RR   ',
      ' CC  CCC  CCC CC ',
      ' CC  CC    CC CC ',
    ]),
    'sea-turtle': centerSpriteRows([
      '                                  ',
      '                           HHH    ',
      '                         HHHHHH   ',
      '        LLLLLLLLLLLLLL  HHHHHWHH  ',
      '  HHH GGGGCCCCGGGCCCGGHHHHHHHHBH  ',
      ' HHHHGGCCCGGGGCCCGGGCCHHHHHHHHHH  ',
      '  HHHGGGCCCGGGGCCCGGGCCHHHHHHHH   ',
      '   HHHGGGGCCCGGGGCCCGGGHHHHHHH    ',
      '        GPPPPPPPPPPPPGHHHHHH      ',
      '      LL  PPPPPPPPPPGGG HHH       ',
      '    HHHH    PPPPPP       HHH      ',
      '   HHHH      PPPP         HHH     ',
      '  HHHH                     HHH    ',
      '   HHH                      HHH   ',
      '                                  ',
    ]),
    seahorse: [
      '          HHHH          ',
      '         HHHHHH         ',
      '       HHHGGGGG         ',
      '      GGGGSSGGGG        ',
      '    FGGGGWBGGGGGG       ',
      '      GGGGGGGGGGSS      ',
      '        GGGGGGSSGGGG    ',
      '         GGGGGGGGGGGG   ',
      '          GGGSSGGGGGGG  ',
      '         GGGGGGGGGGGGFF ',
      '       CCGGGSSGGGGGGGG   ',
      '      CCCCCCGGGGGGGGG    ',
      '       CCCCCGGGGGGGG     ',
      '          CCCGGGGG       ',
      '        FFFCGGGGG        ',
      '      FFFFFGGGGG         ',
      '    FFFFFFGGGGG          ',
      '   FFFFFFGGGG            ',
      '    FFFFGGGG             ',
      '      GGGG               ',
      '       GGGGG             ',
      '          GGGG           ',
      '             GGG         ',
      '               GGG       ',
      '              GGGG       ',
      '            GGGGG        ',
      '          GGGGGG         ',
      '         GGGGG           ',
      '          GGG             ',
    ],
  };
  const WHALE = [
    '             BBBBB              ',
    '           BBBBBBBBB            ',
    '        BBBBBBBBBBBBBB           ',
    '      BBBBBBBBBBBBBBBBBB         ',
    '   BBBBBBBBBBBBBBBBBBBBBBB       ',
    ' BBBBBBBBBBBBBBBBBBBBBBBBBBBB    ',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB ',
    ' BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
    '   BBBBBBBBCCCCBBBBBBBBBBBBBBBBBB ',
    '     BBBBBBBCCCCBBBBBBBBBBBBBBBBBB',
    '        BBBBBBBBBBBBBBBBBBBBBBBBBBB',
    '             BBBBBBBBBBBBBBBBBBBB  ',
    '               BBBBBBBB  BBBBBBB   ',
  ];
  const WHALE_COLORS = {
    B: '#328ba9',
    C: '#c5f1ed',
  };
  const WHALE_SHARK_SPANS = [
    [15, 19], [12, 22], [9, 26], [5, 29], [2, 31], [1, 32],
    [3, 33], [7, 33], [12, 32], [18, 30], [23, 27],
  ];
  const BLUE_WHALE_SPANS = [
    [17, 21], [14, 24], [10, 29], [6, 33], [3, 36], [1, 38],
    [0, 39], [1, 39], [4, 38], [8, 36], [13, 33], [18, 29], [20, 26],
  ];
  const WHALE_SHARK_WIDTH = 34;
  const BLUE_WHALE_WIDTH = 40;
  const COLORS = {
    goldfish: { F: '#f3a832', T: '#ce6228', S: '#f06f32', Y: '#ffe27a', H: '#fff0a0', W: '#fff4d0', B: '#3b2934' },
    anglerfish: { F: '#e99c32', L: '#ffe06d', O: '#fff0a0', W: '#fff8df', D: '#4b3340', C: '#bd5362', R: '#e77f35' },
    crab: { R: '#d94a3d', C: '#a93238', W: '#fff5d8', B: '#392c3c' },
    'sea-turtle': { G: '#347f58', C: '#3f7f39', H: '#66b84a', L: '#72ad47', W: '#fff4a8', B: '#143b2c', P: '#d6e58b' },
    seahorse: { G: '#e8a83e', S: '#a8663c', C: '#fff0b0', F: '#d97948', H: '#f2c96b', W: '#f4e8bd', B: '#342e39' },
  };
  const PET_OUTLINES = {
    goldfish: '#713820',
    anglerfish: '#653d2c',
    crab: '#702b37',
    'sea-turtle': '#143b2c',
    seahorse: '#563b32',
    diver: '#15364d',
  };
  const PET_HIGHLIGHTS = {
    goldfish: '#fff0a0',
    anglerfish: '#ffe06d',
    crab: '#ff9c73',
    'sea-turtle': '#a2df8d',
    seahorse: '#ffdb83',
  };
  const PET_EYES = {
    goldfish: [8],
    anglerfish: [4],
    crab: [4, 9],
    'sea-turtle': [29],
    seahorse: [9],
  };
  const PET_SCALES = Object.freeze({ crab: 4, 'sea-turtle': 3, seahorse: 2 });

  function createVisualEngine(canvas, options) {
    const context = canvas.getContext('2d', { alpha: true });
    const { document, window } = options;
    const requestFrame = options.requestAnimationFrame;
    const cancelFrame = options.cancelAnimationFrame;
    const now = options.now;
    const random = options.random || Math.random;
    function randomBetween(min, max) {
      return min + random() * (max - min);
    }
    let reducedMotion = options.reducedMotion;
    const pets = [];
    const schoolFish = [];
    const divers = [];
    const inkBlots = [];
    const whaleSplashDroplets = [];
    const typingParticles = [];
    let preferences = { powerMode: true, petMode: 'all', selectedPets: Object.keys(PETS) };
    let combo = 0;
    let roamingHeight = MIN_ROAMING_HEIGHT;
    let targetRoamingHeight = MIN_ROAMING_HEIGHT;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationId = null;
    let previousFrame = 0;
    let lastRender = 0;
    let accumulatedDelta = 0;
    let elapsed = 0;
    let shakeUntil = 0;
    let whale = null;
    let whaleShark = null;
    let blueWhale = null;
    let fishSpawnAccumulator = 0;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let destroyed = false;

    function allowedPetTypes() {
      if (Array.isArray(preferences.selectedPets)) {
        return preferences.selectedPets.filter((type) => PET_TYPES.includes(type));
      }
      switch (preferences.petMode) {
        case 'all': return PET_TYPES;
        case 'goldfish-anglerfish': return ['goldfish', 'anglerfish'];
        case 'goldfish': return ['goldfish'];
        case 'anglerfish': return ['anglerfish'];
        case 'octopus': return ['octopus'];
        default: return [];
      }
    }

    function hasWater() {
      const types = allowedPetTypes();
      return types.includes('octopus') || types.includes('seahorse');
    }

    function speedMultiplier() {
      return Math.min(MAX_COMBO_SPEED, 1 + combo * SPEED_PER_HIT);
    }

    function canShowWhales() {
      return pets.length > 0 && !reducedMotion;
    }

    function createWhaleVisitor(yRatio) {
      return {
        x: width / 2,
        y: roamingHeight * yRatio,
        direction: random() < 0.5 ? -1 : 1,
        verticalDirection: random() < 0.5 ? -1 : 1,
      };
    }

    function updateWhales() {
      if (!canShowWhales() || roamingHeight <= height / 3) {
        whale = null;
        whaleShark = null;
        whaleSplashDroplets.length = 0;
      } else {
        if (!whale) {
          whale = {
            ...createWhaleVisitor(0.55),
            splashTimer: 0.15,
          };
        }
        if (!whaleShark) whaleShark = createWhaleVisitor(0.46);
      }
      if (!canShowWhales() || roamingHeight <= height / 2) blueWhale = null;
      else if (!blueWhale) blueWhale = createWhaleVisitor(0.58);
    }

    function canShowFishSchool() {
      return pets.length > 0 && !reducedMotion && roamingHeight > height * FISH_SCHOOL_THRESHOLD;
    }

    function canShowDivers() {
      return pets.length > 0 && !reducedMotion && roamingHeight > height / 2;
    }

    function createDiver(index) {
      return {
        x: width * (index + 1) / (MAX_DIVERS + 1),
        y: roamingHeight - 16 - index * 5,
        phase: randomBetween(0, Math.PI * 2),
        speed: randomBetween(25, 34),
      };
    }

    function updateDivers(deltaSeconds) {
      if (!canShowDivers()) {
        divers.length = 0;
        return;
      }
      while (divers.length < MAX_DIVERS) divers.push(createDiver(divers.length));
      for (const diver of divers) {
        diver.y -= diver.speed * deltaSeconds;
        diver.x += Math.sin(elapsed * 0.7 + diver.phase) * 10 * deltaSeconds;
        if (diver.y < roamingHeight * 0.18) diver.y = roamingHeight - 16;
        diver.x = Math.max(24, Math.min(width - 24, diver.x));
      }
    }

    function createSchoolFish() {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * 48;
      return {
        x: randomBetween(-18, 14),
        y: randomBetween(5, Math.min(55, Math.max(5, roamingHeight - 5))),
        offsetX: Math.cos(angle) * radius,
        offsetY: Math.sin(angle) * radius,
        speed: randomBetween(180, 290),
        direction: 1,
      };
    }

    function updateFishSchool(deltaSeconds) {
      if (!canShowFishSchool()) {
        schoolFish.length = 0;
        fishSpawnAccumulator = 0;
        return;
      }

      fishSpawnAccumulator += SCHOOL_FISH_SPAWN_RATE * deltaSeconds;
      while (fishSpawnAccumulator >= 1 && schoolFish.length < MAX_SCHOOL_FISH) {
        schoolFish.push(createSchoolFish());
        fishSpawnAccumulator -= 1;
      }
      if (schoolFish.length === MAX_SCHOOL_FISH) fishSpawnAccumulator = 0;

      for (const fish of schoolFish) {
        const targetX = Math.max(6, Math.min(pointerX + fish.offsetX, width - 6));
        const targetY = Math.max(6, Math.min(pointerY + fish.offsetY, roamingHeight - 6));
        const deltaX = targetX - fish.x;
        const deltaY = targetY - fish.y;
        const distance = Math.hypot(deltaX, deltaY);
        if (distance > 0) {
          const travel = Math.min(distance, fish.speed * deltaSeconds);
          fish.x += (deltaX / distance) * travel;
          fish.y += (deltaY / distance) * travel;
          if (Math.abs(deltaX) > 0.1) fish.direction = deltaX < 0 ? -1 : 1;
        }
      }
    }

    function onPointerMove(event) {
      if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
    }

    function updateTargetRoamingHeight() {
      const pageHeight = Math.max(MIN_ROAMING_HEIGHT, height);
      const comboProgress = Math.min(combo / COMBO_TO_FULL_PAGE, 1);
      targetRoamingHeight = MIN_ROAMING_HEIGHT + (pageHeight - MIN_ROAMING_HEIGHT) * comboProgress;
    }

    function createPet(type, x) {
      const halfHeight = petHalfHeight(type);
      return {
        type,
        x,
        y: randomBetween(halfHeight, Math.max(halfHeight, roamingHeight - halfHeight)),
        direction: random() < 0.5 ? -1 : 1,
        verticalDirection: random() < 0.5 ? -1 : 1,
        speed: randomBetween(18, 42),
        verticalSpeed: randomBetween(12, 28),
        inkTimer: randomBetween(1.2, 3.8),
      };
    }

    function resize() {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      pointerX = Math.max(0, Math.min(pointerX, width));
      pointerY = Math.max(0, Math.min(pointerY, height));
      updateTargetRoamingHeight();
      roamingHeight = Math.min(roamingHeight, height);
      updateWhales();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      render(now(), true);
    }

    function ensurePopulation() {
      const types = allowedPetTypes();
      if (!types.includes('octopus')) inkBlots.length = 0;
      for (let index = pets.length - 1; index >= 0; index -= 1) {
        if (!types.includes(pets[index].type)) pets.splice(index, 1);
      }
      while (pets.length > MAX_PETS) pets.pop();
      if (types.length === 0 || reducedMotion) {
        pets.length = 0;
        schoolFish.length = 0;
        divers.length = 0;
        fishSpawnAccumulator = 0;
        inkBlots.length = 0;
        updateWhales();
        return;
      }
      while (pets.length < MAX_PETS) {
        const type = types[Math.floor(random() * types.length)];
        pets.push(createPet(type, randomBetween(0, Math.max(width, 1))));
      }
      updateDivers(0);
      updateWhales();
    }

    function needsAnimation() {
      return !destroyed && !reducedMotion && !document.hidden &&
        (pets.length > 0 || typingParticles.length > 0 || inkBlots.length > 0 ||
          Math.abs(targetRoamingHeight - roamingHeight) > 0);
    }

    function ensureLoop() {
      if (animationId === null && needsAnimation()) animationId = requestFrame(frame);
    }

    function stopLoop() {
      if (animationId !== null) cancelFrame(animationId);
      animationId = null;
      previousFrame = 0;
    }

    function spawnInk(pet) {
      for (let i = 0; i < 8; i += 1) {
        inkBlots.push({
          x: pet.x + randomBetween(-5, 5),
          y: pet.y + randomBetween(-3, 3),
          vx: randomBetween(-18, 18),
          vy: randomBetween(-10, 10),
          radius: randomBetween(2, 4),
          life: randomBetween(1.5, 2.8),
          maxLife: 2.8,
        });
      }
      if (inkBlots.length > MAX_INK_BLOTS) inkBlots.splice(0, inkBlots.length - MAX_INK_BLOTS);
    }

    function moveWhaleVisitor(visitor, deltaSeconds, speed, halfWidth, halfHeight) {
      if (!visitor) return;
      const leftBound = Math.min(halfWidth, width / 2);
      const rightBound = Math.max(width - halfWidth, width / 2);
      visitor.x += speed * speedMultiplier() * visitor.direction * deltaSeconds;
      if (visitor.x < leftBound || visitor.x > rightBound) visitor.direction *= -1;
      visitor.x = Math.max(leftBound, Math.min(visitor.x, rightBound));

      const topBound = Math.min(halfHeight + 4, roamingHeight / 2);
      const bottomBound = Math.max(roamingHeight - halfHeight - 4, roamingHeight / 2);
      visitor.y += speed * 0.45 * visitor.verticalDirection * deltaSeconds;
      if (visitor.y < topBound || visitor.y > bottomBound) visitor.verticalDirection *= -1;
      visitor.y = Math.max(topBound, Math.min(visitor.y, bottomBound));
    }

    function update(deltaSeconds) {
      elapsed += deltaSeconds;
      const heightDifference = targetRoamingHeight - roamingHeight;
      const heightChange = (heightDifference > 0 ? ROAMING_EXPANSION_SPEED : ROAMING_CONTRACTION_SPEED) * deltaSeconds;
      roamingHeight += Math.sign(heightDifference) * Math.min(Math.abs(heightDifference), heightChange);
      updateWhales();
      updateFishSchool(deltaSeconds);
      updateDivers(deltaSeconds);
      for (const pet of pets) {
        pet.x += pet.speed * speedMultiplier() * pet.direction * deltaSeconds;
        const halfHeight = petHalfHeight(pet.type);
        const lowerBound = Math.min(halfHeight, roamingHeight / 2);
        const upperBound = Math.max(lowerBound, roamingHeight - halfHeight);
        pet.y += pet.verticalSpeed * speedMultiplier() * pet.verticalDirection * deltaSeconds;
        if (pet.type === 'octopus') pet.y += Math.sin(elapsed * 1.5 + pet.x * 0.03) * deltaSeconds * 4;
        if (pet.y < lowerBound || pet.y > upperBound) {
          pet.y = Math.max(lowerBound, Math.min(pet.y, upperBound));
          pet.verticalDirection *= -1;
        }
        if (pet.type === 'octopus') {
          pet.inkTimer -= deltaSeconds;
          if (pet.inkTimer <= 0) {
            spawnInk(pet);
            pet.inkTimer = randomBetween(2.2, 5.4);
          }
        }
        const halfWidth = petHalfWidth(pet.type);
        if (pet.x < -halfWidth || pet.x > width + halfWidth) {
          const types = allowedPetTypes();
          const type = types[Math.floor(random() * types.length)];
          const respawnAtRight = pet.x < 0;
          Object.assign(pet, createPet(type, respawnAtRight ? width + petHalfWidth(type) : -petHalfWidth(type)));
          pet.direction = respawnAtRight ? -1 : 1;
        }
      }
      for (let index = inkBlots.length - 1; index >= 0; index -= 1) {
        const blot = inkBlots[index];
        blot.x += blot.vx * deltaSeconds;
        blot.y += blot.vy * deltaSeconds;
        blot.radius += deltaSeconds * 3;
        blot.life -= deltaSeconds;
        if (blot.life <= 0) inkBlots.splice(index, 1);
      }
      for (let index = typingParticles.length - 1; index >= 0; index -= 1) {
        const particle = typingParticles[index];
        particle.x += particle.vx * deltaSeconds;
        particle.y += particle.vy * deltaSeconds;
        particle.vy += 14 * deltaSeconds;
        particle.life -= deltaSeconds;
        if (particle.life <= 0) typingParticles.splice(index, 1);
      }
      if (whale) {
        whale.x += 38 * speedMultiplier() * whale.direction * deltaSeconds;
        if (whale.x < 76 || whale.x > width - 76) whale.direction *= -1;
        whale.x = Math.max(76, Math.min(whale.x, width - 76));
        const whaleTop = 46;
        const whaleBottom = roamingHeight - 42;
        if (whaleBottom > whaleTop) {
          whale.y += 18 * whale.verticalDirection * deltaSeconds;
          if (whale.y < whaleTop || whale.y > whaleBottom) {
            whale.y = Math.max(whaleTop, Math.min(whale.y, whaleBottom));
            whale.verticalDirection *= -1;
          }
        }
        whale.splashTimer -= deltaSeconds;
        if (whale.splashTimer <= 0) {
          for (let index = 0; index < 6; index += 1) {
            const side = index % 2 === 0 ? -1 : 1;
            whaleSplashDroplets.push({
              x: whale.x + side * randomBetween(48, 68),
              y: whale.y + randomBetween(6, 19),
              vx: side * randomBetween(8, 24),
              vy: randomBetween(-48, -24),
              radius: randomBetween(1.6, 3.2),
              life: randomBetween(0.45, 0.85),
              maxLife: 0.85,
            });
          }
          if (whaleSplashDroplets.length > MAX_WHALE_SPLASH_DROPLETS) {
            whaleSplashDroplets.splice(0, whaleSplashDroplets.length - MAX_WHALE_SPLASH_DROPLETS);
          }
          whale.splashTimer = randomBetween(0.55, 0.9);
        }
      }
      moveWhaleVisitor(whaleShark, deltaSeconds, 24, 70, 23);
      moveWhaleVisitor(blueWhale, deltaSeconds, 19, 124, 32);
      for (let index = whaleSplashDroplets.length - 1; index >= 0; index -= 1) {
        const droplet = whaleSplashDroplets[index];
        droplet.x += droplet.vx * deltaSeconds;
        droplet.y += droplet.vy * deltaSeconds;
        droplet.vy += 60 * deltaSeconds;
        droplet.life -= deltaSeconds;
        if (droplet.life <= 0) whaleSplashDroplets.splice(index, 1);
      }
    }

    function drawWater(time) {
      if (!hasWater()) return;
      context.fillStyle = 'rgba(28, 174, 208, 0.12)';
      context.fillRect(0, 0, width, roamingHeight);
      context.strokeStyle = 'rgba(105, 248, 228, 0.55)';
      context.lineWidth = 2;
      for (let blade = 0; blade < Math.ceil(width / 92); blade += 1) {
        const x = blade * 92 + 12;
        context.beginPath();
        context.moveTo(x, roamingHeight);
        context.quadraticCurveTo(x + Math.sin(time * 0.001 + blade) * 9, roamingHeight * 0.6, x + 4, roamingHeight * 0.35);
        context.stroke();
        context.beginPath();
        context.moveTo(x, roamingHeight * 0.8);
        context.quadraticCurveTo(x + Math.sin(time * 0.0015 + blade) * 12, roamingHeight * 0.7, x - 8, roamingHeight * 0.62);
        context.stroke();
      }
    }

    function drawSeaHorse(pet, time) {
      const pattern = PETS.seahorse;
      const scale = petScale('seahorse');
      const widthInPixels = Math.max(...pattern.map((row) => row.length));
      const originX = Math.round(pet.x - widthInPixels * scale / 2);
      const originY = Math.round(pet.y - pattern.length * scale / 2 + Math.sin(time * 0.004 + pet.x) * 1.5);
      const finWave = Math.sin(time * 0.01 + pet.x * 0.02);
      context.fillStyle = '#d97948';
      for (let ray = 0; ray < 3; ray += 1) {
        context.fillRect(originX + scale * (22 + ray) + finWave * 2, originY + scale * (9 + ray), scale * 2, scale);
      }
      drawPixelPet('seahorse', pet.x, pet.y, time);
      context.fillStyle = '#c87843';
      context.fillRect(originX + scale * 11, originY + scale * 18, scale * 3, scale);
      context.fillRect(originX + scale * 10, originY + scale * 19, scale * 3, scale);
      context.fillRect(originX + scale * 9, originY + scale * 20, scale * 3, scale);
      context.fillRect(originX + scale * 10, originY + scale * 21, scale * 3, scale);
      context.fillRect(originX + scale * 12, originY + scale * 21, scale * 2, scale);
    }

    function drawSchoolFish(time) {
      for (let index = 0; index < schoolFish.length; index += 1) {
        const fish = schoolFish[index];
        const x = Math.round(fish.x);
        const y = Math.round(fish.y + Math.sin(time * 0.008 + index) * 1.5);
        const tailX = fish.direction > 0 ? x - 6 : x + 4;
        const eyeX = fish.direction > 0 ? x + 1 : x - 2;

        context.shadowColor = '#ffb44d';
        context.shadowBlur = 4;
        context.fillStyle = '#bf623e';
        context.fillRect(tailX, y - 2, 2, 4);
        context.fillStyle = '#ffa63b';
        context.fillRect(x - 3, y - 2, 6, 4);
        context.fillStyle = '#ffd36a';
        context.fillRect(x - 2, y - 2, 3, 1);
        context.fillStyle = '#fff4d0';
        context.fillRect(eyeX, y - 1, 1, 1);
        context.fillStyle = '#18425c';
        context.fillRect(eyeX, y - 1, 0.5, 1);
      }
      context.shadowBlur = 0;
    }

    function drawPixelPet(type, x, y, time) {
      const pattern = PETS[type];
      const scale = petScale(type);
      const patternWidth = Math.max(...pattern.map((row) => row.length));
      const originX = Math.round(x - patternWidth * scale / 2);
      const originY = Math.round(y - pattern.length * scale / 2 + Math.sin(time * 0.006 + x) * 1.5);
      const palette = COLORS[type];
      const outline = PET_OUTLINES[type];
      const isFilled = (row, column) => Boolean(
        pattern[row] && palette[pattern[row][column]],
      );
      context.shadowColor = outline;
      context.shadowBlur = 4;

      for (let row = 0; row < pattern.length; row += 1) {
        for (let column = 0; column < pattern[row].length; column += 1) {
          if (!isFilled(row, column)) continue;
          const pixelX = originX + column * scale;
          const pixelY = originY + row * scale;
          context.fillStyle = outline;
          if (!isFilled(row - 1, column)) context.fillRect(pixelX, pixelY - 1, scale, 1);
          if (!isFilled(row + 1, column)) context.fillRect(pixelX, pixelY + scale, scale, 1);
          if (!isFilled(row, column - 1)) context.fillRect(pixelX - 1, pixelY, 1, scale);
          if (!isFilled(row, column + 1)) context.fillRect(pixelX + scale, pixelY, 1, scale);
        }
      }

      for (let row = 0; row < pattern.length; row += 1) {
        for (let column = 0; column < pattern[row].length; column += 1) {
          const color = palette[pattern[row][column]];
          if (!color) continue;
          const pixelX = originX + column * scale;
          const pixelY = originY + row * scale;
          context.fillStyle = color;
          context.fillRect(pixelX, pixelY, scale, scale);
          if (!isFilled(row - 1, column) && color !== palette.W) {
            context.fillStyle = PET_HIGHLIGHTS[type];
            context.fillRect(pixelX, pixelY, scale, 1);
          }
          if (
            (row === 3 || row === 4)
            && PET_EYES[type].includes(column)
            && (pattern[row][column] === 'W' || pattern[row][column] === 'P')
          ) {
            context.fillStyle = outline;
            context.fillRect(pixelX + 1, pixelY + 1, 1, 2);
            context.fillStyle = '#ffffff';
            context.fillRect(pixelX + 1, pixelY + 1, 1, 1);
          }
        }
      }
      context.shadowBlur = 0;
    }

    function drawSeaTurtleFlipper(x, y, angle, scale, color) {
      const halfWidths = [0, 1, 1, 2, 2, 1, 0];
      function drawPixel(step, across, fillColor) {
        const distance = (step + 0.5) * scale;
        const offset = across * scale;
        const pixelX = Math.round((x + Math.sin(angle) * distance + Math.cos(angle) * offset) / scale) * scale;
        const pixelY = Math.round((y + Math.cos(angle) * distance - Math.sin(angle) * offset) / scale) * scale;
        context.fillStyle = fillColor;
        context.fillRect(pixelX, pixelY, scale, scale);
      }

      for (let step = 0; step < halfWidths.length; step += 1) {
        const halfWidth = halfWidths[step];
        for (let across = -halfWidth - 1; across <= halfWidth + 1; across += 1) {
          drawPixel(step, across, PET_OUTLINES['sea-turtle']);
        }
      }
      for (let step = 0; step < halfWidths.length; step += 1) {
        const halfWidth = halfWidths[step];
        for (let across = -halfWidth; across <= halfWidth; across += 1) {
          drawPixel(step, across, color);
        }
      }
      drawPixel(2, 0, '#9cdf69');
      drawPixel(3, 0, '#9cdf69');
    }

    function drawSeaTurtle(pet, time) {
      const type = 'sea-turtle';
      const pattern = PETS[type];
      const scale = petScale(type);
      const patternWidth = Math.max(...pattern.map((row) => row.length));
      const originX = Math.round(pet.x - patternWidth * scale / 2);
      const originY = Math.round(pet.y - pattern.length * scale / 2 + Math.sin(time * 0.006 + pet.x) * 1.5);
      const stroke = time * 0.006 + pet.x * 0.015;

      drawSeaTurtleFlipper(originX + scale * 9, originY + scale * 8, Math.PI + Math.sin(stroke + 0.7) * 0.48, scale, '#4a8d50');
      drawSeaTurtleFlipper(originX + scale * 20, originY + scale * 8, Math.PI + Math.sin(stroke + 2.1) * 0.48, scale, '#4a8d50');
      drawPixelPet(type, pet.x, pet.y, time);
      drawSeaTurtleFlipper(originX + scale * 9, originY + scale * 10, -0.58 + Math.sin(stroke) * 0.58, scale, '#82c94f');
      drawSeaTurtleFlipper(originX + scale * 20, originY + scale * 10, 0.58 + Math.sin(stroke + Math.PI) * 0.58, scale, '#74b83f');
    }

    function drawDiverLimb(startX, startY, endX, endY, color, pixelSize) {
      for (let step = 0; step <= 4; step += 1) {
        const progress = step / 4;
        const x = Math.round(startX + (endX - startX) * progress);
        const y = Math.round(startY + (endY - startY) * progress);
        context.fillStyle = PET_OUTLINES.diver;
        context.fillRect(x - pixelSize / 2 - 1, y - pixelSize / 2 - 1, pixelSize + 2, pixelSize + 2);
        context.fillStyle = color;
        context.fillRect(x - pixelSize / 2, y - pixelSize / 2, pixelSize, pixelSize);
      }
    }

    function drawDiver(diver, time) {
      const x = Math.round(diver.x);
      const y = Math.round(diver.y);
      const stroke = time * 0.008 + diver.phase;
      const armSwing = Math.sin(stroke) * 5;
      const kick = Math.sin(stroke + Math.PI / 2) * 5;

      context.shadowColor = '#15364d';
      context.shadowBlur = 3;
      drawDiverLimb(x - 3, y - 4, x - 9 - armSwing, y - 9, '#ffc98a', 3);
      drawDiverLimb(x + 3, y - 4, x + 9 + armSwing, y - 9, '#ffc98a', 3);
      drawDiverLimb(x - 2, y + 5, x - 5 - kick, y + 13, '#153e62', 4);
      drawDiverLimb(x + 2, y + 5, x + 5 + kick, y + 13, '#153e62', 4);

      context.fillStyle = '#db5348';
      context.fillRect(x + 4, y - 7, 5, 12);
      context.fillStyle = '#fff0b0';
      context.fillRect(x + 3, y - 7, 2, 12);
      context.fillStyle = PET_OUTLINES.diver;
      context.fillRect(x - 4, y - 6, 9, 14);
      context.fillStyle = '#178b9d';
      context.fillRect(x - 3, y - 5, 7, 12);
      context.fillStyle = '#31c1c0';
      context.fillRect(x - 2, y - 4, 2, 8);

      context.fillStyle = PET_OUTLINES.diver;
      context.fillRect(x - 4, y - 15, 9, 8);
      context.fillStyle = '#ffc98a';
      context.fillRect(x - 3, y - 14, 7, 6);
      context.fillStyle = '#f4e8bd';
      context.fillRect(x - 4, y - 15, 9, 3);
      context.fillRect(x - 2, y - 17, 5, 2);
      context.fillStyle = '#56dfe5';
      context.fillRect(x, y - 12, 4, 2);
      context.shadowBlur = 0;
    }

    function drawOctopus(pet, time) {
      const x = pet.x;
      const y = pet.y + Math.sin(time * 0.003 + x * 0.04) * 2;
      context.lineCap = 'round';
      for (let arm = 0; arm < 6; arm += 1) {
        const offset = (arm - 2.5) * 3.5;
        const startX = x + offset;
        const controlX = startX + Math.sin(time * 0.004 + arm) * 5;
        const controlY = y + 12 + Math.sin(time * 0.005 + arm) * 3;
        const endX = startX + Math.sin(time * 0.003 + arm * 2) * 8;
        const traceArm = () => {
          context.beginPath();
          context.moveTo(startX, y + 5);
          context.quadraticCurveTo(controlX, controlY, endX, y + 15);
        };
        traceArm();
        context.strokeStyle = '#571d72';
        context.lineWidth = 5;
        context.stroke();
        traceArm();
        context.strokeStyle = '#e67cff';
        context.lineWidth = 2.5;
        context.stroke();

        for (const progress of [0.38, 0.68]) {
          const inverse = 1 - progress;
          const suckerX = inverse * inverse * startX
            + 2 * inverse * progress * controlX
            + progress * progress * endX;
          const suckerY = inverse * inverse * (y + 5)
            + 2 * inverse * progress * controlY
            + progress * progress * (y + 15);
          context.fillStyle = '#571d72';
          context.fillRect(suckerX - 1.5, suckerY - 1, 3, 3);
          context.fillStyle = '#f2a7ff';
          context.fillRect(suckerX - 0.5, suckerY - 0.5, 1, 1);
        }
      }
      context.shadowColor = '#571d72';
      context.shadowBlur = 6;
      context.fillStyle = '#571d72';
      context.fillRect(x - 12, y - 11, 24, 21);
      context.fillStyle = '#b84ddb';
      context.fillRect(x - 10, y - 9, 20, 17);
      context.shadowBlur = 0;
      context.fillStyle = '#f49dff';
      context.fillRect(x - 8, y - 13, 16, 6);
      context.fillStyle = '#f2a7ff';
      context.fillRect(x - 7, y - 8, 14, 2);
      context.fillStyle = '#ff9bcf';
      context.fillRect(x - 9, y + 2, 2, 2);
      context.fillRect(x + 7, y + 2, 2, 2);
      context.fillStyle = '#fff7ff';
      context.fillRect(x - 6, y - 3, 4, 5);
      context.fillRect(x + 2, y - 3, 4, 5);
      context.fillStyle = '#341044';
      context.fillRect(x - 5, y - 1, 2, 3);
      context.fillRect(x + 3, y - 1, 2, 3);
    }

    function drawWhaleSplash(time) {
      if (!whale) return;
      context.strokeStyle = 'rgba(116, 239, 255, 0.88)';
      context.lineWidth = 2.5;
      for (const side of [-1, 1]) {
        const x = whale.x + side * 49;
        const y = whale.y + 24;
        const swell = Math.sin(time * 0.008 + side) * 2;
        context.beginPath();
        context.moveTo(x - side * 14, y + 4);
        context.quadraticCurveTo(x - side * 4, y - 10 + swell, x + side * 2, y + 1);
        context.quadraticCurveTo(x + side * 9, y + 10, x + side * 16, y + 2);
        context.stroke();
      }
      context.strokeStyle = 'rgba(194, 250, 255, 0.9)';
      context.lineWidth = 1.5;
      for (const droplet of whaleSplashDroplets) {
        context.globalAlpha = Math.max(0, droplet.life / droplet.maxLife);
        context.fillStyle = '#8defff';
        context.beginPath();
        context.arc(droplet.x, droplet.y, droplet.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      context.strokeStyle = 'rgba(121, 235, 255, 0.84)';
      context.beginPath();
      context.moveTo(whale.x - 7, whale.y - 27);
      context.quadraticCurveTo(whale.x - 15, whale.y - 40 + Math.sin(time * 0.007) * 2, whale.x - 17, whale.y - 46);
      context.moveTo(whale.x, whale.y - 28);
      context.quadraticCurveTo(whale.x + 3, whale.y - 39, whale.x + 8, whale.y - 44);
      context.stroke();
    }

    function drawWhale(time) {
      if (!whale) return;
      const scale = 5;
      const bob = Math.sin(time * 0.003 + whale.x * 0.012) * 2;
      const originX = Math.round(whale.x - WHALE[0].length * scale / 2);
      const originY = Math.round(whale.y - WHALE.length * scale / 2 + bob);
      context.shadowColor = '#55ddff';
      context.shadowBlur = 12;
      for (let row = 0; row < WHALE.length; row += 1) {
        for (let column = 0; column < WHALE[row].length; column += 1) {
          const color = WHALE_COLORS[WHALE[row][column]];
          if (!color) continue;
          context.fillStyle = color;
          context.fillRect(originX + column * scale, originY + row * scale, scale, scale);
        }
      }
      context.shadowBlur = 0;
      context.fillStyle = '#f5ffff';
      context.fillRect(whale.x + 31, whale.y - 6 + bob, 6, 6);
      context.fillStyle = '#17495d';
      context.fillRect(whale.x + 33, whale.y - 4 + bob, 3, 4);
      context.fillStyle = '#ffadbd';
      context.globalAlpha = 0.75;
      context.fillRect(whale.x + 40, whale.y + 5 + bob, 8, 4);
      context.globalAlpha = 1;
      drawWhaleSplash(time);
    }

    function drawWhaleVisitor(visitor, time, species) {
      if (!visitor) return;
      const isShark = species === 'shark';
      const spans = isShark ? WHALE_SHARK_SPANS : BLUE_WHALE_SPANS;
      const widthInPixels = isShark ? WHALE_SHARK_WIDTH : BLUE_WHALE_WIDTH;
      const scale = isShark ? 4 : 6;
      const bob = Math.sin(time * 0.003 + visitor.x * 0.01) * 2;
      const originX = Math.round(visitor.x - widthInPixels * scale / 2);
      const originY = Math.round(visitor.y - spans.length * scale / 2 + bob);
      const colors = isShark
        ? {
          outline: '#173e55',
          body: '#276b82',
          highlight: '#6397a2',
          belly: '#a9d9d5',
          spot: '#c7e7de',
          gill: '#17465b',
        }
        : {
          outline: '#123a68',
          body: '#287fc1',
          highlight: '#5db5ed',
          belly: '#a9e7ff',
          spot: '#7dd2f5',
          gill: '#1d5c98',
        };
      const containsPixel = (row, column) => Boolean(
        spans[row] && column >= spans[row][0] && column <= spans[row][1],
      );

      context.shadowColor = colors.outline;
      context.shadowBlur = isShark ? 7 : 14;
      for (let row = 0; row < spans.length; row += 1) {
        const [left, right] = spans[row];
        for (let column = left; column <= right; column += 1) {
          const pixelX = originX + column * scale;
          const pixelY = originY + row * scale;
          if (
            !containsPixel(row - 1, column)
            || !containsPixel(row + 1, column)
            || !containsPixel(row, column - 1)
            || !containsPixel(row, column + 1)
          ) {
            context.fillStyle = colors.outline;
            context.fillRect(pixelX - 1, pixelY - 1, scale + 2, scale + 2);
          }
        }
      }
      for (let row = 0; row < spans.length; row += 1) {
        const [left, right] = spans[row];
        for (let column = left; column <= right; column += 1) {
          const pixelX = originX + column * scale;
          const pixelY = originY + row * scale;
          let color = row >= spans.length - 4 ? colors.belly : colors.body;
          if (row === 1 || row === 2) color = colors.highlight;
          if (isShark && row >= 2 && row <= 7 && (column + row * 2) % 5 === 0) {
            color = colors.spot;
          }
          if (row >= 5 && row <= 8 && column >= widthInPixels - (isShark ? 8 : 10)
            && column <= widthInPixels - (isShark ? 6 : 8)) {
            color = colors.gill;
          }
          context.fillStyle = color;
          context.fillRect(pixelX, pixelY, scale, scale);
        }
      }
      context.shadowBlur = 0;

      const tailY = originY + Math.round(spans.length * scale * 0.53);
      const tailSwing = Math.sin(time * 0.007 + visitor.x * 0.02) * scale;
      context.fillStyle = colors.outline;
      context.fillRect(originX - scale * 3, tailY - scale + tailSwing, scale * 3, scale * 2);
      context.fillRect(originX - scale * 3, tailY - scale * 3 + tailSwing, scale * 2, scale * 2);
      context.fillRect(originX - scale * 3, tailY + scale + tailSwing, scale * 2, scale * 2);
      context.fillStyle = colors.body;
      context.fillRect(originX - scale * 3, tailY + tailSwing, scale * 2, scale);
      context.fillRect(originX - scale * 2, tailY - scale * 2 + tailSwing, scale, scale);
      context.fillRect(originX - scale * 2, tailY + scale + tailSwing, scale, scale);

      const eyeX = originX + (widthInPixels - (isShark ? 5 : 6)) * scale;
      const eyeY = originY + scale * 4;
      context.fillStyle = '#f3ffff';
      context.fillRect(eyeX, eyeY, scale, scale);
      context.fillStyle = colors.outline;
      context.fillRect(eyeX + scale * 0.45, eyeY + scale * 0.25, scale * 0.45, scale * 0.6);
    }

    function drawAmbient(time) {
      if (reducedMotion) return;
      context.save();
      context.beginPath();
      context.rect(0, 0, width, roamingHeight);
      context.clip();
      drawWater(time);
      for (const blot of inkBlots) {
        context.globalAlpha = Math.max(0, blot.life / blot.maxLife) * 0.6;
        context.fillStyle = '#152754';
        context.beginPath();
        context.arc(blot.x, blot.y, blot.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      for (const pet of pets) {
        if (pet.type === 'octopus') drawOctopus(pet, time);
        else if (pet.type === 'sea-turtle') drawSeaTurtle(pet, time);
        else if (pet.type === 'seahorse') drawSeaHorse(pet, time);
        else drawPixelPet(pet.type, pet.x, pet.y, time);
      }
      drawSchoolFish(time);
      for (const diver of divers) drawDiver(diver, time);
      drawWhale(time);
      drawWhaleVisitor(whaleShark, time, 'shark');
      drawWhaleVisitor(blueWhale, time, 'blue');
      context.restore();
    }

    function drawParticles() {
      for (const particle of typingParticles) {
        context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
        context.fillStyle = particle.color;
        context.shadowColor = particle.color;
        context.shadowBlur = particle.spark ? 13 : 6;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.spark ? 2.3 : 1.8, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      context.shadowBlur = 0;
    }

    function drawCounter() {
      if (!preferences.powerMode) return;
      const x = 12;
      const y = 9;
      context.shadowColor = '#13f6ff';
      context.shadowBlur = 11;
      context.fillStyle = 'rgba(8, 13, 32, 0.86)';
      context.fillRect(x, y, 138, 40);
      context.strokeStyle = '#13f6ff';
      context.lineWidth = 2;
      context.strokeRect(x + 1, y + 1, 136, 38);
      context.shadowBlur = 0;
      context.font = 'bold 9px monospace';
      context.fillStyle = '#8efcff';
      context.fillText('DEVELOPER POWER', x + 8, y + 12);
      context.font = 'bold 18px monospace';
      context.fillStyle = '#fff';
      context.fillText(`COMBO ${String(combo).padStart(2, '0')}`, x + 8, y + 32);
    }

    function render(time, force = false) {
      if (!force && !reducedMotion && time - lastRender < FPS_INTERVAL) return;
      lastRender = time;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      const shake = time < shakeUntil ? Math.sin(time * 0.14) * 3 : 0;
      context.save();
      context.translate(shake, shake ? Math.cos(time * 0.11) * 1.5 : 0);
      drawAmbient(time);
      drawParticles();
      drawCounter();
      context.restore();
    }

    function frame(time) {
      animationId = null;
      if (!needsAnimation()) return;
      if (previousFrame === 0) previousFrame = time;
      const deltaMs = Math.max(0, time - previousFrame);
      previousFrame = time;
      accumulatedDelta += deltaMs;
      if (time - lastRender >= FPS_INTERVAL) {
        const deltaSeconds = Math.min(accumulatedDelta / 1000, 0.05);
        accumulatedDelta = 0;
        update(deltaSeconds);
        render(time);
      }
      animationId = requestFrame(frame);
    }

    function onVisibilityChange() {
      if (document.hidden) stopLoop();
      else {
        previousFrame = 0;
        accumulatedDelta = 0;
        ensureLoop();
      }
    }

    function setPreferences(next) {
      preferences = {
        powerMode: next.powerMode === true,
        petMode: typeof next.petMode === 'string' ? next.petMode : 'off',
        selectedPets: Array.isArray(next.selectedPets)
          ? next.selectedPets.filter((type) => PET_TYPES.includes(type))
          : null,
      };
      ensurePopulation();
      if (!preferences.powerMode) typingParticles.length = 0;
      render(now(), true);
      ensureLoop();
      if (!needsAnimation()) stopLoop();
    }

    function addHit(hit) {
      combo = hit.combo;
      updateTargetRoamingHeight();
      if (reducedMotion) {
        render(now(), true);
        return;
      }
      const x = Number.isFinite(hit.x) ? hit.x : 24;
      const y = Number.isFinite(hit.y) ? hit.y : 30;
      const spark = combo % 3 === 0;
      const count = spark ? 14 : 4;
      for (let index = 0; index < count; index += 1) {
        const angle = random() * Math.PI * 2;
        const speed = randomBetween(spark ? 24 : 12, spark ? 75 : 36);
        typingParticles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: randomBetween(0.35, spark ? 0.8 : 0.55),
          maxLife: spark ? 0.8 : 0.55,
          color: spark ? (index % 2 ? '#fc69ff' : '#62faff') : '#8cfff2',
          spark,
        });
      }
      if (typingParticles.length > MAX_TYPING_PARTICLES) {
        typingParticles.splice(0, typingParticles.length - MAX_TYPING_PARTICLES);
      }
      if (combo > 0 && combo % 10 === 0) shakeUntil = now() + 240;
      ensureLoop();
      render(now());
    }

    function resetCombo() {
      combo = 0;
      updateTargetRoamingHeight();
      ensureLoop();
      render(now());
    }

    function getActivityCounts() {
      return {
        pets: pets.length,
        schoolFish: schoolFish.length,
        divers: divers.length,
        inkBlots: inkBlots.length,
        typingParticles: typingParticles.length,
        whale: whale !== null,
        whaleShark: whaleShark !== null,
        blueWhale: blueWhale !== null,
        splashDroplets: whaleSplashDroplets.length,
      };
    }

    function setReducedMotion(value) {
      if (reducedMotion === value) return;
      reducedMotion = value;
      if (reducedMotion) {
        pets.length = 0;
        schoolFish.length = 0;
        divers.length = 0;
        fishSpawnAccumulator = 0;
        inkBlots.length = 0;
        typingParticles.length = 0;
        whale = null;
        whaleShark = null;
        blueWhale = null;
        whaleSplashDroplets.length = 0;
        stopLoop();
      } else {
        ensurePopulation();
        ensureLoop();
      }
      render(now(), true);
    }

    function destroy() {
      destroyed = true;
      stopLoop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      pets.length = 0;
      schoolFish.length = 0;
      divers.length = 0;
      inkBlots.length = 0;
      whale = null;
      whaleShark = null;
      blueWhale = null;
      whaleSplashDroplets.length = 0;
      typingParticles.length = 0;
      context.clearRect(0, 0, width, height);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove);
    document.addEventListener('visibilitychange', onVisibilityChange);
    resize();

    return { addHit, resetCombo, setPreferences, setReducedMotion, getActivityCounts, destroy };
  }

  return { createVisualEngine };
});
