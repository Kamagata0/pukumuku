// ============================================================
// 純くんの焼きたてパンキャッチ！ 〜めざせ黒字経営〜
// パン工房プクムク 公式ゲーム (c) パン工房プクムク
// ============================================================

// --- 1. サウンドシステム (Web Audio API: 100%著作権フリー自作) ---
class SoundSystem {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // 通常パンキャッチ音 (かわいいマリンバ風)
  playCatch() {
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const f = notes[Math.floor(Math.random() * notes.length)];
    this.playTone(f, 'sine', 0.18, 0.25);
    setTimeout(() => this.playTone(f * 1.5, 'triangle', 0.15, 0.15), 50);
  }

  // 金のパンキャッチ音 (キラキラファンファーレ)
  playGoldCatch() {
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.25, 0.3), i * 60);
    });
  }

  // コゲパン (コミカルな「あちゃ〜」音)
  playBurnt() {
    if (!this.ctx) return;
    this.playTone(180, 'sawtooth', 0.2, 0.15);
  }

  // オーブンチーン音 (パンタワー収納ボーナス)
  playOvenDing() {
    if (!this.ctx) return;
    this.playTone(1318.51, 'sine', 0.6, 0.35); // E6
    setTimeout(() => this.playTone(2637.02, 'sine', 0.8, 0.2), 30);
  }

  // フィーバー突入音
  playFever() {
    if (!this.ctx) return;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'square', 0.2, 0.15), i * 80);
    });
  }

  // 終了歓声
  playGameEnd() {
    if (!this.ctx) return;
    [523, 659, 783, 1046].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.5, 0.25), i * 120);
    });
  }
}

const sounds = new SoundSystem();

// --- 2. ゲームステート & 設定 ---
const GAME_CONFIG = {
  duration: 45, // 45秒
  moveSpeed: 18.0,
  stageWidth: 3.6, // 画面端でも見切れない安全な移動可能範囲（±1.8）
  catchRadius: 0.50, // キャラクター縮小(0.58)に合わせた的確な難易度判定
  maxTower: 5, // パンタワーの最大数
};

const BREAD_TYPES = {
  bread_loaf: { name: "山型食パン", score: 100, scale: 0.28, speed: 3.5, prob: 0.18 },
  bread_croissant: { name: "クロワッサン", score: 200, scale: 0.28, speed: 4.0, prob: 0.16 },
  bread_melon: { name: "メロンパン", score: 300, scale: 0.28, speed: 3.8, prob: 0.15 },
  bread_cornet: { name: "チョココロネ", score: 250, scale: 0.28, speed: 3.9, prob: 0.14 },
  bread_baguette: { name: "フランスパン", score: 150, scale: 0.28, speed: 4.2, prob: 0.14 },
  bread_anpan: { name: "桜あんぱん", score: 180, scale: 0.28, speed: 3.7, prob: 0.11 },
  bread_gold: { name: "金のプクムクパン", score: 1000, scale: 0.28, speed: 4.8, prob: 0.04 },
  bread_burnt: { name: "コゲパン", score: -100, scale: 0.28, speed: 4.4, prob: 0.08 }
};

let gameState = {
  score: 0,
  timeLeft: GAME_CONFIG.duration,
  isRunning: false,
  combo: 0,
  isFever: false,
  feverTimer: 0,
  breadCount: {
    bread_loaf: 0,
    bread_croissant: 0,
    bread_melon: 0,
    bread_cornet: 0,
    bread_baguette: 0,
    bread_anpan: 0,
    bread_gold: 0,
    bread_burnt: 0
  },
  playerX: 0,
  targetX: 0,
  towerBreads: []
};

// --- 3. Three.js セットアップ ---
const canvas = document.getElementById('webgl-canvas');
const container = document.getElementById('game-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFF3DE); // 優しいパン屋の店内カラー
scene.fog = new THREE.Fog(0xFFF3DE, 12, 30);

// カメラ: 正面アングル（純くんとお空から降るパンが画面全体で見渡せるベストビュー）
const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 1.45, 4.3);
camera.lookAt(0, 1.35, 0);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// 温かい照明（白飛びを抑え、鮮やかな壁画を引き立てる）
const ambientLight = new THREE.AmbientLight(0xFFF2DE, 0.78);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xFFE5B4, 1.05);
dirLight.position.set(3, 9, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

// 温かい床（パン屋のウッドカウンター風）
const floorGeo = new THREE.PlaneGeometry(16, 24);
const floorMat = new THREE.MeshStandardMaterial({ color: 0xC68642, roughness: 0.6 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// カウンターの市松模様のラグ
const rugGeo = new THREE.PlaneGeometry(4.6, 18);
const rugMat = new THREE.MeshStandardMaterial({ color: 0xF7DCB4, roughness: 0.8 });
const rug = new THREE.Mesh(rugGeo, rugMat);
rug.rotation.x = -Math.PI / 2;
rug.position.set(0, 0.01, 0);
rug.receiveShadow = true;
scene.add(rug);

// --- 4. モデル読み込み ---
const loader = new THREE.GLTFLoader();
const junKunGroup = new THREE.Group();
scene.add(junKunGroup);

let junKun = null;
let mixer = null;
let animations = {};
let currentAction = null;
const CACHE_BUST = 'v=20260924_13';

const breadTemplates = {};
const activeBreads = [];

// --- リアル画像テクスチャ生成システム (CanvasTexture) ---
// 1. 実店舗の写真そっくりの「温かみのある黄色 ＋ 青とオレンジのポップな壁画」
function createShopWallTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#FFE54C';
  ctx.fillRect(0, 0, 512, 512);

  // レンガ・漆喰調のテクスチャライン
  ctx.strokeStyle = '#FAD02C';
  ctx.lineWidth = 3;
  for (let y = 0; y < 512; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }

  // 鮮やかなスカイブルーのキノコ・パン模様パターン
  ctx.fillStyle = '#1E90FF';
  for (let y = 40; y < 512; y += 90) {
    for (let x = (y % 180 === 40 ? 35 : 80); x < 512; x += 100) {
      ctx.beginPath();
      ctx.arc(x, y, 24, Math.PI, 0);
      ctx.lineTo(x + 14, y + 26);
      ctx.lineTo(x - 14, y + 26);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ポップなオレンジのアクセント柄
  ctx.fillStyle = '#FF5722';
  for (let y = 85; y < 512; y += 90) {
    for (let x = (y % 180 === 85 ? 35 : 85); x < 512; x += 100) {
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

// 2. 木製ショーケース・枠組み用 木目テクスチャ
function createWoodTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8D4925';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#6E3414';
  ctx.lineWidth = 4;
  for (let y = 0; y < 256; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y + (Math.sin(y * 0.2) * 4));
    ctx.lineTo(256, y + (Math.cos(y * 0.2) * 4));
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

// 3. 看板「🍞 パン工房 PUKUMUKU 🥖」オーニングテクスチャ
function createSignboardTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  // 鮮やかなプクムクレッド
  ctx.fillStyle = '#E52417';
  ctx.fillRect(0, 0, 512, 128);
  // ゴールド枠
  ctx.strokeStyle = '#FFE082';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 112);
  // 文字影
  ctx.fillStyle = '#8E140B';
  ctx.font = '900 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🍞 PANKOUBOU PUKUMUKU 🥐', 258, 66);
  // 文字白
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('🍞 PANKOUBOU PUKUMUKU 🥐', 256, 64);
  return new THREE.CanvasTexture(c);
}

// 4. メロンパンの焼き色＆格子
function createMelonBreadTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#EED279';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#936916';
  ctx.lineWidth = 10;
  for (let i = -256; i < 512; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, 256); ctx.lineTo(i + 256, 0); ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

// 5. クロワッサンの香ばしいパイ層
function createCroissantTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#D35D15';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 20) {
    ctx.fillStyle = (y % 40 === 0) ? '#FFA23A' : '#7D2E04';
    ctx.fillRect(0, y, 256, 10);
  }
  return new THREE.CanvasTexture(c);
}

// 6. 山型食パンの耳と白断面
function createLoafBreadTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#FFF8EE';
  ctx.fillRect(0, 0, 256, 256);
  ctx.lineWidth = 32;
  ctx.strokeStyle = '#823807';
  ctx.strokeRect(16, 16, 224, 224);
  ctx.fillStyle = '#6E2A03';
  ctx.fillRect(0, 0, 256, 75);
  return new THREE.CanvasTexture(c);
}

// 7. チョココロネの渦巻き＆濃厚チョコ
function createCornetTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#E59A44';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#AF6519';
  for (let x = 0; x < 256; x += 36) {
    ctx.fillRect(x, 0, 14, 256);
  }
  // 先端の濃密チョコ
  ctx.fillStyle = '#3E1D0C';
  ctx.beginPath();
  ctx.arc(128, 128, 60, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(c);
}

// 8. フランスパン（バゲット）のクープ
function createBaguetteTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#E29742';
  ctx.fillRect(0, 0, 256, 256);
  // 斜めクープの切れ込み
  ctx.fillStyle = '#FFF3D6';
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 6;
  for (let y = 30; y < 256; y += 55) {
    ctx.beginPath();
    ctx.ellipse(128, y, 70, 16, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

// 9. 桜あんぱん（中央のへこみと黒ごま）
function createAnpanTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#C86E20';
  ctx.fillRect(0, 0, 256, 256);
  // 中央の桜色・ケシの実
  ctx.fillStyle = '#222222';
  for (let i = 0; i < 28; i++) {
    const rx = 128 + (Math.random() - 0.5) * 44;
    const ry = 128 + (Math.random() - 0.5) * 44;
    ctx.fillRect(rx, ry, 5, 5);
  }
  return new THREE.CanvasTexture(c);
}

// 10. コゲパン（炭化・ひび割れ）
function createBurntTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1A1412';
  ctx.fillRect(0, 0, 256, 256);
  // 赤い焦げひび割れ
  ctx.strokeStyle = '#4A1D13';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, Math.random() * 256);
    ctx.lineTo(Math.random() * 256, Math.random() * 256);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

const shopWallTex = createShopWallTexture();
const woodTex = createWoodTexture();
const signTex = createSignboardTexture();
const melonTex = createMelonBreadTexture();
const croissantTex = createCroissantTexture();
const loafTex = createLoafBreadTexture();
const cornetTex = createCornetTexture();
const baguetteTex = createBaguetteTexture();
const anpanTex = createAnpanTexture();
const burntTex = createBurntTexture();

// 店舗モデルの読み込み＆全パーツへの美しいテクスチャ適用！
loader.load(`models/pukumuku_shop.glb?${CACHE_BUST}`, (gltf) => {
  const shop = gltf.scene;
  shop.position.set(0, 0, -1.8);
  shop.scale.set(0.75, 0.75, 0.75);
  shop.rotation.set(0, 0, 0);

  shop.traverse((child) => {
    if (child.isMesh) {
      child.receiveShadow = true;
      const n = child.name;

      if (n.includes('Wall') || n.includes('Shop_Wall')) {
        child.material = new THREE.MeshStandardMaterial({
          map: shopWallTex,
          roughness: 0.65
        });
      } else if (n.includes('AwningText') || n.includes('Awning') || n.includes('plt')) {
        child.material = new THREE.MeshStandardMaterial({
          map: signTex,
          roughness: 0.35
        });
      } else if (n.includes('ShowcaseFrame') || n.includes('DoorFrame') || n.includes('Shelf')) {
        child.material = new THREE.MeshStandardMaterial({
          map: woodTex,
          roughness: 0.5
        });
      } else if (n.includes('Bread')) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xD37318,
          roughness: 0.4
        });
      } else if (n.includes('SunFace') || n.includes('Moon')) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xFFCA28,
          roughness: 0.3
        });
      } else if (n.includes('SunFlame')) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xE53935,
          roughness: 0.4
        });
      }
    }
  });
  scene.add(shop);
});

// 純くんの木箱メッシュ参照と、地面に置く木箱
let junBreadBox = null;
let groundBasket = null;

// 純くん（箱持ち＆上見上げ新モデル）の読み込み
loader.load(`models/jun_kun_carry_box.glb?${CACHE_BUST}`, (gltf) => {
  junKun = gltf.scene;
  junKun.rotation.set(0, 0, 0);

  // 難易度・アクション性向上のため、純くんをコンパクト化（0.58）
  const scale = 0.58;
  junKun.scale.set(scale, scale, scale);
  junKun.position.set(0, 0, 0);

  junKun.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      // 木箱メッシュの特定
      if (child.name.includes('Bread') || child.name.includes('Box') || child.name.includes('Basket') || child.name.includes('立方体.004')) {
        junBreadBox = child;
      }
    }
  });

  junKunGroup.add(junKun);

  mixer = new THREE.AnimationMixer(junKun);
  gltf.animations.forEach((clip) => {
    animations[clip.name] = mixer.clipAction(clip);
  });

  // 初期画面（タイトル表示中）から、純くんがカメラに楽しそうに手を振る！
  if (animations['Wave']) {
    playAnimation('Wave', 0.2, true);
  } else if (animations['Carry_Idle']) {
    playAnimation('Carry_Idle', 0.2);
  }
}, undefined, (err) => console.error("Error loading Jun-kun:", err));

// パンモデルの読み込み (全8種類に画像テクスチャを確実に適用！)
Object.keys(BREAD_TYPES).forEach((key) => {
  loader.load(`models/${key}.glb?${CACHE_BUST}`, (gltf) => {
    const model = gltf.scene;
    
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (key === 'bread_melon') {
          child.material = new THREE.MeshStandardMaterial({ map: melonTex, roughness: 0.5 });
        } else if (key === 'bread_croissant') {
          child.material = new THREE.MeshStandardMaterial({ map: croissantTex, roughness: 0.45 });
        } else if (key === 'bread_loaf') {
          child.material = new THREE.MeshStandardMaterial({ map: loafTex, roughness: 0.55 });
        } else if (key === 'bread_cornet') {
          child.material = new THREE.MeshStandardMaterial({ map: cornetTex, roughness: 0.45 });
        } else if (key === 'bread_baguette') {
          child.material = new THREE.MeshStandardMaterial({ map: baguetteTex, roughness: 0.5 });
        } else if (key === 'bread_anpan') {
          child.material = new THREE.MeshStandardMaterial({ map: anpanTex, roughness: 0.5 });
        } else if (key === 'bread_gold') {
          child.material = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9, roughness: 0.15 });
        } else if (key === 'bread_burnt') {
          child.material = new THREE.MeshStandardMaterial({ map: burntTex, roughness: 0.95 });
        }
      }
    });

    breadTemplates[key] = model;
  });
});

function playAnimation(name, fadeDuration = 0.25, loop = true) {
  if (!mixer || !animations[name]) return;
  const newAction = animations[name];
  if (currentAction === newAction) return;

  if (currentAction) {
    currentAction.fadeOut(fadeDuration);
  }

  newAction.reset();
  newAction.fadeIn(fadeDuration);
  if (!loop) {
    newAction.setLoop(THREE.LoopOnce);
    newAction.clampWhenFinished = true;
  } else {
    newAction.setLoop(THREE.LoopRepeat);
  }
  newAction.play();
  currentAction = newAction;
}

// --- 5. 操作入力（タッチ・マウス・キーボード） ---
let isPointerDown = false;
let runHoldTimer = 0;

// 画面のアスペクト比・視野角に応じた安全な移動限界X（どんな端末でも絶対に見切れない！）
function getSafeMoveLimit() {
  const dist = camera.position.z; // 4.3
  const vFovRad = (camera.fov * Math.PI) / 180;
  const halfH = Math.tan(vFovRad * 0.5) * dist;
  const halfW = halfH * camera.aspect;
  // 純くんの体幅とマージン (0.32) を差し引いた限界値
  return Math.max(0.6, halfW - 0.32);
}

function setTargetFromClientX(clientX) {
  const rect = container.getBoundingClientRect();
  const normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1; // -1 ~ 1
  const limitX = getSafeMoveLimit();
  gameState.targetX = normalizedX * limitX;
  gameState.targetX = Math.max(-limitX, Math.min(limitX, gameState.targetX));
}

container.addEventListener('pointerdown', (e) => {
  isPointerDown = true;
  setTargetFromClientX(e.clientX);
});

container.addEventListener('pointermove', (e) => {
  if (isPointerDown || !('ontouchstart' in window)) {
    setTargetFromClientX(e.clientX);
  }
});

window.addEventListener('pointerup', () => isPointerDown = false);
window.addEventListener('pointercancel', () => isPointerDown = false);

// キーボード操作
const keys = {};
let isKeyMoving = false;
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

function handleKeyboardInput(delta) {
  const speed = 6.5;
  const limitX = getSafeMoveLimit();
  isKeyMoving = false;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
    gameState.targetX -= speed * delta;
    isKeyMoving = true;
  }
  if (keys['ArrowRight'] || keys['d'] || keys['D']) {
    gameState.targetX += speed * delta;
    isKeyMoving = true;
  }
  gameState.targetX = Math.max(-limitX, Math.min(limitX, gameState.targetX));
}

// --- 6. パンの生成 & 落下管理 ---
let spawnTimer = 0;

function chooseBreadType() {
  if (gameState.isFever) {
    return Math.random() < 0.6 ? 'bread_gold' : 'bread_melon';
  }
  const r = Math.random();
  let acc = 0;
  for (const [key, val] of Object.entries(BREAD_TYPES)) {
    acc += val.prob;
    if (r <= acc) return key;
  }
  return 'bread_loaf';
}

function spawnBread() {
  const typeKey = chooseBreadType();
  const template = breadTemplates[typeKey];
  if (!template) return;

  const breadMesh = template.clone();
  const def = BREAD_TYPES[typeKey];

  const scale = def.scale;
  breadMesh.scale.set(scale, scale, scale);

  // 画面上部の完全一定ライン（Y = 4.0）から綺麗にスポーン！
  const spawnHeight = 4.0;
  const limitX = getSafeMoveLimit() * 0.92;
  const spawnX = (Math.random() * 2 - 1) * limitX;
  breadMesh.position.set(spawnX, spawnHeight, 0);

  activeBreads.push({
    mesh: breadMesh,
    type: typeKey,
    def: def,
    speed: def.speed * (0.9 + Math.random() * 0.25),
    rotSpeedX: (Math.random() - 0.5) * 2.0,
    rotSpeedY: (Math.random() - 0.5) * 2.0,
    wobblePhase: Math.random() * Math.PI * 2
  });

  scene.add(breadMesh);
}

// --- 7. キャッチ時のポップアップ & パンタワー ---
const popupContainer = document.getElementById('popup-container');

function showScorePopup(x, y, text, color = '#D34600') {
  const pop = document.createElement('div');
  pop.className = 'catch-popup';
  pop.innerText = text;
  pop.style.color = color;
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  popupContainer.appendChild(pop);
  setTimeout(() => pop.remove(), 850);
}

function addBreadToTower(typeKey) {
  if (!junKun) return;
  const template = breadTemplates[typeKey];
  if (!template) return;

  const towerItem = template.clone();
  towerItem.scale.set(0.18, 0.18, 0.18);

  const idx = gameState.towerBreads.length;
  // 純くんが抱える木箱の中にすっぽり収まり、順番に上に積み重なる！
  const h = 0.40 + idx * 0.07;
  towerItem.position.set(gameState.playerX, h, 0.15);
  scene.add(towerItem);

  gameState.towerBreads.push(towerItem);

  // 箱がいっぱいになったらボーナス箱詰め！
  if (gameState.towerBreads.length >= GAME_CONFIG.maxTower) {
    setTimeout(packBreadTower, 200);
  }
}

function packBreadTower() {
  if (gameState.towerBreads.length === 0) return;
  sounds.playOvenDing();

  // ボーナス加算
  const bonus = 500;
  gameState.score += bonus;
  updateScoreUI();

  // 画面中央にボーナスポップアップ
  const rect = container.getBoundingClientRect();
  showScorePopup(rect.width * 0.5 - 60, rect.height * 0.45, `✨ 大入り箱詰め! +¥${bonus}`, '#FF8F00');

  // タワーのパンを消去
  gameState.towerBreads.forEach((mesh) => {
    scene.remove(mesh);
  });
  gameState.towerBreads = [];
}

// --- 8. UI更新 ---
const scoreText = document.getElementById('score-text');
const timerText = document.getElementById('timer-text');
const startScreen = document.getElementById('start-screen');
const resultScreen = document.getElementById('result-screen');
const finalScoreText = document.getElementById('final-score-text');
const rankBadge = document.getElementById('rank-badge');
const breadStats = document.getElementById('bread-stats');

function updateScoreUI() {
  scoreText.innerText = gameState.score.toLocaleString();
}

function updateTimerUI() {
  timerText.innerText = Math.ceil(gameState.timeLeft);
}

// --- 9. ゲームループ & アニメーション ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  // ゲーム中、または終了時の中央歩行シークエンス中
  if (gameState.isRunning || gameState.isEnding) {
    if (gameState.isRunning) {
      // 制限時間カウントダウン
      gameState.timeLeft -= delta;
      if (gameState.timeLeft <= 0) {
        gameState.timeLeft = 0;
        endGame();
      }
      updateTimerUI();

      // フィーバー管理
      if (gameState.isFever) {
        gameState.feverTimer -= delta;
        if (gameState.feverTimer <= 0) {
          gameState.isFever = false;
        }
      }

      // キーボード入力
      handleKeyboardInput(delta);
    }

    // 純くんの移動（ターゲットXへスムーズに補間）
    const prevX = gameState.playerX;
    const diff = gameState.targetX - gameState.playerX;
    const moveSpd = gameState.isEnding ? 4.5 : GAME_CONFIG.moveSpeed;
    gameState.playerX += diff * Math.min(1.0, moveSpd * delta);
    const limitX = getSafeMoveLimit();
    gameState.playerX = Math.max(-limitX, Math.min(limitX, gameState.playerX));
    const movedDist = Math.abs(gameState.playerX - prevX);

    // 移動フラグ判定
    const isActivelyMoving = (gameState.isRunning && (isKeyMoving || (isPointerDown && Math.abs(diff) > 0.04))) ||
                             (gameState.isEnding && Math.abs(diff) > 0.03) ||
                             movedDist > 0.004;

    if (isActivelyMoving) {
      runHoldTimer = 0.2;
    } else if (runHoldTimer > 0) {
      runHoldTimer -= delta;
    }

    if (junKunGroup) {
      junKunGroup.position.x = gameState.playerX;

      // 終了演出中で中央に到着した場合はお辞儀アニメーション
      if (gameState.isEnding && Math.abs(diff) <= 0.03 && !gameState.isBowing) {
        gameState.isBowing = true;
        junKunGroup.rotation.y = 0;
        if (animations['Bow']) {
          playAnimation('Bow', 0.25, false);
        } else {
          playAnimation('Carry_Idle', 0.2);
        }
      } else if (!gameState.isBowing) {
        // 移動中はCarry_Run、停止時はCarry_Idle
        if (runHoldTimer > 0) {
          playAnimation(animations['Carry_Run'] ? 'Carry_Run' : 'Run', 0.12);
          const targetTilt = diff > 0.04 ? 0.15 : (diff < -0.04 ? -0.15 : 0);
          junKunGroup.rotation.y += (targetTilt - junKunGroup.rotation.y) * 10 * delta;
        } else {
          playAnimation(animations['Carry_Idle'] ? 'Carry_Idle' : 'Idle', 0.2);
          junKunGroup.rotation.y += (0 - junKunGroup.rotation.y) * 10 * delta;
        }
      }

      // 木箱の中のパンを純くんの移動に追従＆可愛く揺らす（ゲーム中のみ）
      if (gameState.isRunning) {
        gameState.towerBreads.forEach((bread, idx) => {
          bread.position.x = gameState.playerX;
          bread.position.y = 0.40 + idx * 0.07;
          bread.position.z = 0.15;
          bread.rotation.z = Math.sin(clock.getElapsedTime() * 4 + idx) * 0.05;
          bread.rotation.y = idx * 0.2;
        });
      }
    }

    // パンの生成 (ゲーム中のみ)
    if (gameState.isRunning) {
      const interval = gameState.isFever ? 0.45 : 0.85;
      spawnTimer += delta;
      if (spawnTimer >= interval) {
        spawnTimer = 0;
        spawnBread();
      }

      // 落ちてくるパンの更新 & キャッチ判定
      for (let i = activeBreads.length - 1; i >= 0; i--) {
        const b = activeBreads[i];
        b.mesh.position.y -= b.speed * delta;
        b.mesh.rotation.x += b.rotSpeedX * delta;
        b.mesh.rotation.y += b.rotSpeedY * delta;
        b.mesh.position.x += Math.sin(clock.getElapsedTime() * 3 + b.wobblePhase) * 0.01;

        // キャッチ判定（縮小された純くんにピッタリの当たり判定）
        const dist = Math.abs(b.mesh.position.x - gameState.playerX);
        if (b.mesh.position.y <= 1.3 && b.mesh.position.y >= 0.15 && dist < GAME_CONFIG.catchRadius) {
          scene.remove(b.mesh);
          activeBreads.splice(i, 1);

          gameState.breadCount[b.type]++;

          // 画面上のスクリーン座標にポップアップ
          const screenPos = b.mesh.position.clone().project(camera);
          const screenX = (screenPos.x * 0.5 + 0.5) * container.clientWidth;
          const screenY = (-(screenPos.y * 0.5) + 0.5) * container.clientHeight;

          if (b.type === 'bread_burnt') {
            // お邪魔コゲパン：-100点、コンボリセット、フィーバー終了
            sounds.playBurnt();
            gameState.score = Math.max(0, gameState.score - 100);
            updateScoreUI();
            showScorePopup(screenX - 45, screenY, "⚠️ コゲパン! -¥100", "#D50000");
            gameState.combo = 0;
            gameState.isFever = false;
          } else if (b.type === 'bread_gold') {
            sounds.playGoldCatch();
            gameState.score += b.def.score;
            updateScoreUI();
            showScorePopup(screenX - 40, screenY, `✨ +¥${b.def.score}`, "#E65100");
            gameState.combo++;
            addBreadToTower(b.type);
          } else {
            sounds.playCatch();
            gameState.score += b.def.score;
            updateScoreUI();
            showScorePopup(screenX - 30, screenY, `+¥${b.def.score}`, "#D34600");
            gameState.combo++;
            addBreadToTower(b.type);
          }

          // コンボ5回でフィーバー！
          if (gameState.combo >= 5 && !gameState.isFever) {
            gameState.isFever = true;
            gameState.feverTimer = 8.0;
            sounds.playFever();
            showScorePopup(container.clientWidth * 0.5 - 70, container.clientHeight * 0.35, "🔥 ほかほかフィーバー!!", "#FF3D00");
          }

          continue;
        }

        // 地面に落ちた
        if (b.mesh.position.y < -0.5) {
          scene.remove(b.mesh);
          activeBreads.splice(i, 1);
          if (b.type !== 'bread_burnt') {
            gameState.combo = 0;
          }
        }
      }
    }
  }

  renderer.render(scene, camera);
}

animate();

// --- 10. ゲーム開始 & 終了処理 ---
function startGame() {
  sounds.init();
  gameState.score = 0;
  gameState.timeLeft = GAME_CONFIG.duration;
  gameState.isRunning = false;
  gameState.isEnding = false;
  gameState.isBowing = false;
  gameState.combo = 0;
  gameState.isFever = false;
  gameState.breadCount = {
    bread_loaf: 0,
    bread_croissant: 0,
    bread_melon: 0,
    bread_cornet: 0,
    bread_baguette: 0,
    bread_anpan: 0,
    bread_gold: 0,
    bread_burnt: 0
  };
  gameState.playerX = 0;
  gameState.targetX = 0;

  if (junKunGroup) {
    junKunGroup.position.x = 0;
    junKunGroup.rotation.y = 0;
  }

  // 地面に置いた籠があれば片付ける
  if (groundBasket) {
    scene.remove(groundBasket);
    groundBasket = null;
  }
  // 純くんの手元の木箱を再表示
  if (junBreadBox) {
    junBreadBox.visible = true;
  }

  // 残っているパンをクリア
  activeBreads.forEach((b) => scene.remove(b.mesh));
  activeBreads.length = 0;

  // タワーのパンをクリア
  gameState.towerBreads.forEach((m) => scene.remove(m));
  gameState.towerBreads = [];

  updateScoreUI();
  updateTimerUI();

  startScreen.classList.remove('active');
  resultScreen.classList.remove('active');

  // 開始演出: 純くんがカメラに元気に手を振る（Wave）！
  if (animations['Wave']) {
    playAnimation('Wave', 0.2, false);
  } else {
    playAnimation('Carry_Idle', 0.2);
  }

  // 1.1秒後にパン焼き・キャッチ本番スタート！
  setTimeout(() => {
    gameState.isRunning = true;
    sounds.playOvenDing();
    if (animations['Carry_Idle']) {
      playAnimation('Carry_Idle', 0.2);
    }
  }, 1100);
}

function endGame() {
  gameState.isRunning = false;
  gameState.isEnding = true;
  gameState.isBowing = false;
  sounds.playGameEnd();

  // 残りのタワーもボーナス換算
  if (gameState.towerBreads.length > 0) {
    gameState.score += gameState.towerBreads.length * 100;
    updateScoreUI();
    gameState.towerBreads.forEach((m) => scene.remove(m));
    gameState.towerBreads = [];
  }

  // 籠（パン箱）を地面（足元）にコトンと置く演出！
  if (junBreadBox) {
    junBreadBox.visible = false;
  }
  if (!groundBasket) {
    const geo = new THREE.BoxGeometry(0.24, 0.09, 0.16);
    const mat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.6 });
    groundBasket = new THREE.Mesh(geo, mat);
  }
  groundBasket.position.set(gameState.playerX, 0.045, 0.15);
  scene.add(groundBasket);

  finalScoreText.innerText = gameState.score.toLocaleString();

  // 称号の決定
  let rank = "見習いパン焼き純くん";
  if (gameState.score >= 15000) {
    rank = "👑 伝説の黒字経営マスター！";
  } else if (gameState.score >= 10000) {
    rank = "🌟 三軒茶屋の大繁盛店長！";
  } else if (gameState.score >= 5000) {
    rank = "🥐 街の愛されパン職人！";
  } else if (gameState.score >= 2000) {
    rank = "🍞 黒字達成！看板バイト純くん";
  }
  rankBadge.innerText = rank;

  // パン内訳の表示（全8種対応）
  breadStats.innerHTML = `
    <div>🍞 食パン: ${gameState.breadCount.bread_loaf}個</div>
    <div>🥐 クロワッサン: ${gameState.breadCount.bread_croissant}個</div>
    <div>🍈 メロンパン: ${gameState.breadCount.bread_melon}個</div>
    <div>🐚 コロネ: ${gameState.breadCount.bread_cornet}個</div>
    <div>🥖 バゲット: ${gameState.breadCount.bread_baguette}個</div>
    <div>🌸 あんぱん: ${gameState.breadCount.bread_anpan}個</div>
    <div>✨ 金パン: ${gameState.breadCount.bread_gold}個</div>
    <div>⚠️ コゲパン: ${gameState.breadCount.bread_burnt}個</div>
  `;

  // 終了演出: 純くん自身は中央（X = 0）に向かって軽快に歩いていく！
  gameState.targetX = 0;

  // 中央に到着してお辞儀（Bow）が終わった頃（2.8秒後）にリザルト画面を表示！
  setTimeout(() => {
    saveAndRenderRanking(gameState.score);
    resultScreen.classList.add('active');
  }, 2800);
}

// --- 8. 歴代プクムク純利益ランキングシステム ---
const RANKING_STORAGE_KEY = 'pukumuku_bakery_ranking_v1';

function getRankings() {
  try {
    const raw = localStorage.getItem(RANKING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveAndRenderRanking(currentScore) {
  let rankings = getRankings();
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const currentEntry = {
    id: Date.now(),
    score: currentScore,
    date: dateStr,
    totalBreads: Object.values(gameState.breadCount).reduce((a, b) => a + b, 0)
  };

  rankings.push(currentEntry);
  rankings.sort((a, b) => b.score - a.score);
  rankings = rankings.slice(0, 5);

  try {
    localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(rankings));
  } catch (e) {}

  const rankingListEl = document.getElementById('ranking-list');
  if (rankingListEl) {
    const medals = ['🥇', '🥈', '🥉', '4位', '5位'];
    rankingListEl.innerHTML = rankings.map((item, idx) => {
      const isCurrent = item.id === currentEntry.id;
      return `
        <div class="ranking-row ${isCurrent ? 'current-play' : ''}">
          <span class="ranking-rank">${medals[idx] || (idx + 1 + '位')}</span>
          <span class="ranking-score">¥${item.score.toLocaleString()}</span>
          <span class="ranking-date">${item.date}</span>
        </div>
      `;
    }).join('');
  }
}

// イベントリスナー
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

// リサイズ対応
window.addEventListener('resize', () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

