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
  stageWidth: 5.2, // 左右の移動可能範囲
  catchRadius: 1.1, // 拾いやすい甘めの判定
  maxTower: 5, // パンタワーの最大数 (これに達するとボーナス収納)
};

const BREAD_TYPES = {
  bread_loaf: { name: "山型食パン", score: 100, scale: 0.85, speed: 3.5, prob: 0.35 },
  bread_croissant: { name: "クロワッサン", score: 200, scale: 0.9, speed: 4.0, prob: 0.28 },
  bread_melon: { name: "メロンパン", score: 300, scale: 0.85, speed: 3.8, prob: 0.22 },
  bread_gold: { name: "金のプクムクパン", score: 1000, scale: 0.95, speed: 4.5, prob: 0.07 },
  bread_burnt: { name: "コゲパン", score: 0, scale: 0.8, speed: 4.2, prob: 0.08 }
};

let gameState = {
  score: 0,
  timeLeft: GAME_CONFIG.duration,
  isRunning: false,
  combo: 0,
  isFever: false,
  feverTimer: 0,
  breadCount: { bread_loaf: 0, bread_croissant: 0, bread_melon: 0, bread_gold: 0, bread_burnt: 0 },
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

// カメラ: 純くんの全身が画面の約1/3〜1/2で大きく見え、上からのパンも見える黄金画角
const camera = new THREE.PerspectiveCamera(48, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 2.2, 4.6);
camera.lookAt(0, 1.0, 0);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// 白飛びしない温かい照明
const ambientLight = new THREE.AmbientLight(0xFFF0D6, 0.9);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xFFE5B4, 1.1);
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
const rugGeo = new THREE.PlaneGeometry(5, 18);
const rugMat = new THREE.MeshStandardMaterial({ color: 0xF7DCB4, roughness: 0.8 });
const rug = new THREE.Mesh(rugGeo, rugMat);
rug.rotation.x = -Math.PI / 2;
rug.position.set(0, 0.01, 0);
rug.receiveShadow = true;
scene.add(rug);

// 店内の背景壁
const wallGeo = new THREE.PlaneGeometry(20, 14);
const wallMat = new THREE.MeshStandardMaterial({ color: 0xFEE8D0, roughness: 0.9 });
const wall = new THREE.Mesh(wallGeo, wallMat);
wall.position.set(0, 5, -5);
scene.add(wall);

// --- 4. モデル読み込み ---
const loader = new THREE.GLTFLoader();
let junKun = null;
let mixer = null;
let animations = {};
let currentAction = null;
let junBaseScale = 1.0;
const JUN_FACING_ROTATION = 0; // 新モデルは正面向きで正規化済み

const breadTemplates = {};
const activeBreads = [];

// 純くん（オリジナルカラー完全復元版）の読み込み
loader.load('models/jun_kun_restored.glb', (gltf) => {
  junKun = gltf.scene;

  // サイズを計測して確実に身長1.65mに合わせる
  const bbox = new THREE.Box3().setFromObject(junKun);
  const size = bbox.getSize(new THREE.Vector3());
  console.log("Restored Jun-kun size:", size);

  if (size.y > 0) {
    junBaseScale = 1.65 / size.y;
    junKun.scale.set(junBaseScale, junBaseScale, junBaseScale);
  }

  // 足元が床にぴったり着くようにY座標調整
  const scaledBbox = new THREE.Box3().setFromObject(junKun);
  junKun.position.set(0, -scaledBbox.min.y, 0);
  junKun.rotation.y = JUN_FACING_ROTATION;

  junKun.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(junKun);

  // アニメーションセットアップ
  mixer = new THREE.AnimationMixer(junKun);
  gltf.animations.forEach((clip) => {
    animations[clip.name] = mixer.clipAction(clip);
  });

  console.log("Loaded animations:", Object.keys(animations));
  playAnimation('Idle');
}, undefined, (err) => console.error("Error loading Jun-kun:", err));

// パンモデルの読み込み
Object.keys(BREAD_TYPES).forEach((key) => {
  loader.load(`models/${key}.glb`, (gltf) => {
    breadTemplates[key] = gltf.scene;
    breadTemplates[key].traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
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

function setTargetFromClientX(clientX) {
  const rect = container.getBoundingClientRect();
  const normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1; // -1 ~ 1
  gameState.targetX = normalizedX * (GAME_CONFIG.stageWidth * 0.5);
  gameState.targetX = Math.max(-GAME_CONFIG.stageWidth * 0.5, Math.min(GAME_CONFIG.stageWidth * 0.5, gameState.targetX));
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
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

function handleKeyboardInput(delta) {
  const speed = 7.0;
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
    gameState.targetX -= speed * delta;
  }
  if (keys['ArrowRight'] || keys['d'] || keys['D']) {
    gameState.targetX += speed * delta;
  }
  gameState.targetX = Math.max(-GAME_CONFIG.stageWidth * 0.5, Math.min(GAME_CONFIG.stageWidth * 0.5, gameState.targetX));
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

  const spawnX = (Math.random() - 0.5) * GAME_CONFIG.stageWidth;
  breadMesh.position.set(spawnX, 7.5, 0);

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
  towerItem.scale.set(0.35, 0.35, 0.35);

  const idx = gameState.towerBreads.length;
  const h = 1.7 + idx * 0.22;
  towerItem.position.set(gameState.playerX, h, 0);
  scene.add(towerItem);

  gameState.towerBreads.push(towerItem);

  // 最大数に達したらボーナス収納！
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

    // 純くんの移動（ターゲットXへスムーズに補間）
    const diff = gameState.targetX - gameState.playerX;
    gameState.playerX += diff * Math.min(1.0, GAME_CONFIG.moveSpeed * delta);

    if (junKun) {
      junKun.position.x = gameState.playerX;

      // 移動中はRunアニメーション、止まっている時はIdle
      if (Math.abs(diff) > 0.15) {
        playAnimation('Run', 0.15);
        // 少し進行方向に体を傾ける (正面向きベース + 傾き)
        const tilt = diff > 0 ? 0.25 : -0.25;
        junKun.rotation.y = JUN_FACING_ROTATION + tilt;
      } else {
        playAnimation('Idle', 0.2);
        junKun.rotation.y = JUN_FACING_ROTATION;
      }

      // タワーのパンを純くんの頭上に追従＆ゆらゆら揺らす
      gameState.towerBreads.forEach((bread, idx) => {
        bread.position.x = gameState.playerX;
        bread.position.y = 1.7 + idx * 0.22;
        bread.rotation.z = Math.sin(clock.getElapsedTime() * 4 + idx) * 0.08;
      });
    }

    // パンの生成
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
      // 少しゆらゆら左右に揺れる
      b.mesh.position.x += Math.sin(clock.getElapsedTime() * 3 + b.wobblePhase) * 0.01;

      // キャッチ判定（純くんの足元〜胸の高さ）
      const dist = Math.abs(b.mesh.position.x - gameState.playerX);
      if (b.mesh.position.y <= 1.5 && b.mesh.position.y >= 0.2 && dist < GAME_CONFIG.catchRadius) {
        // キャッチ成功！
        scene.remove(b.mesh);
        activeBreads.splice(i, 1);

        gameState.breadCount[b.type]++;
        gameState.score += b.def.score;
        updateScoreUI();

        // 画面上のスクリーン座標にポップアップ
        const screenPos = b.mesh.position.clone().project(camera);
        const screenX = (screenPos.x * 0.5 + 0.5) * container.clientWidth;
        const screenY = (-(screenPos.y * 0.5) + 0.5) * container.clientHeight;

        if (b.type === 'bread_burnt') {
          sounds.playBurnt();
          showScorePopup(screenX - 30, screenY, "あちゃ〜! コゲ!", "#555");
          gameState.combo = 0;
        } else if (b.type === 'bread_gold') {
          sounds.playGoldCatch();
          showScorePopup(screenX - 40, screenY, `✨ +¥${b.def.score}`, "#E65100");
          gameState.combo++;
          addBreadToTower(b.type);
        } else {
          sounds.playCatch();
          showScorePopup(screenX - 30, screenY, `+¥${b.def.score}`, "#D34600");
          gameState.combo++;
          addBreadToTower(b.type);
        }

        // コンボ5回でフィーバー！
        if (gameState.combo >= 5 && !gameState.isFever) {
          gameState.isFever = true;
          gameState.feverTimer = 8.0; // 8秒間フィーバー
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
          gameState.combo = 0; // コンボリセット（怒られはしない）
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
  gameState.isRunning = true;
  gameState.combo = 0;
  gameState.isFever = false;
  gameState.breadCount = { bread_loaf: 0, bread_croissant: 0, bread_melon: 0, bread_gold: 0, bread_burnt: 0 };
  gameState.playerX = 0;
  gameState.targetX = 0;

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

  playAnimation('Idle');
}

function endGame() {
  gameState.isRunning = false;
  sounds.playGameEnd();

  // 残りのタワーもボーナス換算
  if (gameState.towerBreads.length > 0) {
    gameState.score += gameState.towerBreads.length * 100;
    updateScoreUI();
  }

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

  // パン内訳の表示
  breadStats.innerHTML = `
    <div>🍞 食パン: ${gameState.breadCount.bread_loaf}個</div>
    <div>🥐 クロワッサン: ${gameState.breadCount.bread_croissant}個</div>
    <div>🍈 メロン: ${gameState.breadCount.bread_melon}個</div>
    <div>✨ 金パン: ${gameState.breadCount.bread_gold}個</div>
  `;

  // リザルト画面表示
  resultScreen.classList.add('active');

  // 純くんのアニメーション演出:
  // まず「Hold_Bread_Up（パン掲げ）」で純利益発表、3秒後に「Bow（お辞儀）」でご来店ありがとうございました！
  playAnimation('Hold_Bread_Up', 0.3, false);
  setTimeout(() => {
    playAnimation('Bow', 0.3, false);
  }, 3200);
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

