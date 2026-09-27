import { WORLDS, makeLevel, freshRun, move, undo, solve, isWon, starsFor, normalizeSave, neighbors, transition } from './game.js';
const $ = s => document.querySelector(s);
const drawings = {
  key: '<circle cx="35" cy="32" r="19" fill="none" stroke="var(--key-color,#d9aa4e)" stroke-width="12"/><path d="M47 47l34 34m-16-16 12-12m-3 21 12-12" fill="none" stroke="var(--key-color,#d9aa4e)" stroke-width="11" stroke-linecap="round"/>',
  door: '<rect x="17" y="12" width="66" height="77" rx="8" fill="var(--key-color,#d9aa4e)" stroke="#716458" stroke-width="3"/><path d="M38 17v65m25-65v65M19 33h62M19 71h62" stroke="#fff" opacity=".3" stroke-width="3"/><circle cx="51" cy="48" r="8" fill="#63584e"/><path d="M47 50h8l3 13H44z" fill="#63584e"/>',
  bunny: '<ellipse cx="49" cy="88" rx="30" ry="5" fill="#716286" opacity=".13"/><g stroke="#76627f" stroke-width="2.5"><ellipse cx="37" cy="28" rx="10" ry="23" transform="rotate(-12 37 28)" fill="#fffdf9"/><ellipse cx="65" cy="28" rx="10" ry="23" transform="rotate(12 65 28)" fill="#fffdf9"/><ellipse cx="50" cy="70" rx="25" ry="22" fill="#fffdf9"/><ellipse cx="50" cy="56" rx="30" ry="25" fill="#fffdf9"/></g><g fill="#f3bdcc"><ellipse cx="37" cy="25" rx="4" ry="14" transform="rotate(-12 37 25)"/><ellipse cx="65" cy="25" rx="4" ry="14" transform="rotate(12 65 25)"/><ellipse cx="30" cy="62" rx="7" ry="4"/><ellipse cx="70" cy="62" rx="7" ry="4"/></g><g fill="#514454"><ellipse cx="39" cy="53" rx="2.7" ry="3.5"/><ellipse cx="61" cy="53" rx="2.7" ry="3.5"/><path d="M46 61q4-3 8 0l-4 4z"/></g><path d="M44 67q6 5 12 0" fill="none" stroke="#76627f" stroke-width="2" stroke-linecap="round"/><path d="M35 78q15-7 30 0l-5 11H40z" fill="#a88bd7"/><path d="M43 77l7 7 7-7" fill="#f9d686"/>',
  carrot: '<g transform="rotate(27 50 50)"><path d="M46 32q-19-24-9-26 12 0 15 24-1-30 9-27 10 5-3 30 15-18 19-9 3 9-21 15" fill="#659e62"/><path d="M31 38q19-14 36 0 3 21-19 53-5 7-7-1-18-35-10-52" fill="#ed945b" stroke="#d97c48" stroke-width="2"/><path d="M33 47l12 3m11 11 7-1M38 70l8 2" stroke="#cb7042" stroke-width="3" stroke-linecap="round"/></g>',
  home: '<path d="M20 44h60v43H20z" fill="#ffedc7" stroke="#b68b68" stroke-width="2"/><path d="M11 46L50 13 89 46z" fill="#ad89cf" stroke="#8968ac" stroke-width="2.5" stroke-linejoin="round"/><path d="M41 88V64q0-14 18-7v31" fill="#bb9275"/><circle cx="52" cy="73" r="2" fill="#ffebbd"/><rect x="25" y="55" width="11" height="13" rx="3" fill="#a9d7db"/><path d="M72 27V13h9v23" fill="#bb9275"/><path d="M14 90h72" stroke="#749a6f" stroke-width="5" stroke-linecap="round"/>',
  meadow: '<path d="M12 79q35-29 77 0" fill="#c8dfae"/><path d="M34 80V35m33 45V25" stroke="#72a36a" stroke-width="4"/><g fill="#f8d786"><circle cx="33" cy="26" r="10"/><circle cx="24" cy="36" r="10"/><circle cx="43" cy="37" r="10"/><circle cx="32" cy="45" r="10"/></g><circle cx="33" cy="36" r="6" fill="#bb8860"/><g fill="#fffaf0"><circle cx="68" cy="18" r="9"/><circle cx="59" cy="27" r="9"/><circle cx="77" cy="28" r="9"/><circle cx="68" cy="36" r="9"/></g><circle cx="68" cy="27" r="5" fill="#eac574"/><path d="M35 65q-25-20-21-4 6 13 21 9M66 58q25-24 22-6-5 13-22 12" fill="#89b778"/>',
  mushroom: '<path d="M38 46l-5 36q16 10 32 0l-4-36" fill="#fff0d6" stroke="#c9ae92" stroke-width="2"/><path d="M13 50q5-39 38-39 28 0 37 39-37 17-75 0" fill="#d5918e"/><g fill="#fff1dc"><circle cx="38" cy="28" r="7"/><circle cx="64" cy="35" r="8"/><circle cx="26" cy="46" r="5"/></g><path d="M21 88h59" stroke="#90b17b" stroke-width="5" stroke-linecap="round"/>',
  wave: '<circle cx="71" cy="26" r="13" fill="#f4d485"/><path d="M9 57q10-43 38-23-22-2-16 19 3 11 16 4 16-16 24 0 10 7 20-4v28H9z" fill="#88c4d6"/><path d="M10 76q12-13 27 0 12 13 27 0 12-12 27 0" fill="none" stroke="#d8eff0" stroke-width="7"/>',
  mountain: '<path d="M7 83L39 20l24 40L75 34l21 49" fill="#abaed1"/><path d="M24 50l15-30 18 30-13-5-8 8-5-8zM65 54l10-20 11 24-12-5-3 5z" fill="#fffdf8"/><path d="M8 85h84" stroke="#d4d9ec" stroke-width="7" stroke-linecap="round"/>',
  star: '<path d="M50 9l12 26 29 5-22 22 5 29-24-14-25 14 5-29L9 40l28-5z" fill="#eed082" stroke="#d9b36a" stroke-width="2" stroke-linejoin="round"/><circle cx="40" cy="51" r="2.5" fill="#8e754c"/><circle cx="60" cy="51" r="2.5" fill="#8e754c"/><path d="M43 61q7 6 14 0" stroke="#8e754c" fill="none" stroke-width="2"/>',
  paw: '<g fill="currentColor"><ellipse cx="50" cy="65" rx="23" ry="18"/><ellipse cx="25" cy="40" rx="9" ry="12" transform="rotate(-25 25 40)"/><ellipse cx="46" cy="28" rx="9" ry="12"/><ellipse cx="68" cy="35" rx="9" ry="12" transform="rotate(25 68 35)"/></g>',
  sound: '<path d="M17 41h19l23-18v54L36 59H17z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M70 36q13 14 0 28m10-39q22 25 0 50" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  muted: '<path d="M17 41h19l23-18v54L36 59H17z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><path d="M72 40l18 20m0-20L72 60" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>'
};
function art(name, cls = '') { return `<svg class="art ${cls}" viewBox="0 0 100 100" aria-hidden="true">${drawings[name] || drawings.star}</svg>`; }
document.querySelectorAll('[data-art]').forEach(el => el.innerHTML = art(el.dataset.art));
const SAVE_KEY = 'bunny-adventure-v2';
let save;
try {
  const current = localStorage.getItem(SAVE_KEY);
  const legacy = current ? null : JSON.parse(localStorage.getItem('bunny-adventure-v1'));
  save = normalizeSave(current ? JSON.parse(current) : legacy ? { ...legacy, path: [] } : null);
} catch { save = normalizeSave(null); }
let level, run, hintPos = -1, mapWorld = 0, audio, won = false, saveAvailable = true;
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ stars: save.stars, level: level.number, path: run.history.map(h => h.direction), sound: save.sound })); }
  catch { saveAvailable = false; }
  $('#save-status').textContent = saveAvailable ? '进度会自动保存在这个浏览器' : '浏览器无法保存进度，请保持这个页面打开';
}
function say(message) { $('#announcement').textContent = message; }
function tone(kind) {
  if (!save.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const notes = kind === 'win' ? [523, 659, 784, 1047] : kind === 'carrot' ? [659, 880] : [330];
    notes.forEach((freq, i) => { const osc = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime + i * .11; osc.type = 'sine'; osc.frequency.value = freq; gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.07, t + .015); gain.gain.exponentialRampToValueAtTime(.001, t + .15); osc.connect(gain); gain.connect(audio.destination); osc.start(t); osc.stop(t + .17); });
  } catch { /* Sound is optional when the browser blocks audio. */ }
}
function updateSound() { $('#sound').innerHTML = art(save.sound ? 'sound' : 'muted'); $('#sound').ariaLabel = save.sound ? '关闭音效' : '开启音效'; $('#sound').title = $('#sound').ariaLabel; $('#sound').setAttribute('aria-pressed', String(save.sound)); }
function loadLevel(number, path = []) {
  level = makeLevel(number); run = freshRun(level); hintPos = -1; won = false;
  for (const direction of path) run = move(level, run, direction);
  mapWorld = level.world; save.level = number;
  document.body.dataset.world = level.world;
  $('#level-world').textContent = WORLDS[level.world].name;
  $('#level-number').textContent = number;
  $('#level-name').textContent = number === 1 ? '先观察，再出发' : number % 20 === 0 ? '世界的最后一站' : ['发现一条新小路', '小兔想回家', '带上好奇心', '转个弯，找一找'][(number - 2) % 4];
  $('#carrot-total').textContent = level.carrots.length;
  $('#board').style.setProperty('--size', level.size);
  $('#buddy-title').textContent = number === 1 ? '你好呀，小探险家！' : '新的一关，一起加油！';
  $('#buddy-message').innerHTML = number === 1 ? '我是小兔米米。<br>你能帮我带胡萝卜回家吗？' : `先看看 ${level.carrots.length} 根胡萝卜在哪里，<br>再想想该怎么走吧。`;
  $('#board-caption').textContent = level.ordered ? '按数字顺序收集，先想想钥匙怎么拿' : '先找钥匙，再想想怎样少绕路';
  $('#rule-label').textContent = level.ordered ? '按 1 → ' + level.carrots.length + ' 的顺序收集' : '收集顺序由你决定';
  $('#step-goal').textContent = Math.ceil(level.optimal * 1.2);
  $('#buddy-title').textContent = '这次要先想一想！';
  $('#buddy-message').textContent = level.ordered ? '数字大的胡萝卜要等一等，先找下一个数字。钥匙和门要颜色相同哦。' : '木门挡住了路！找出钥匙在哪里，再规划收集胡萝卜的顺序。';
  drawWorlds(); render(); persist();
  if (isWon(level, run)) complete();
}
function drawWorlds() {
  $('#world-list').innerHTML = WORLDS.map((world, i) => {
    const done = save.stars.slice(i * 20, i * 20 + 20).filter(Boolean).length, locked = save.unlocked <= i * 20;
    return `<button class="world-item ${i === level.world ? 'active' : ''} ${locked ? 'locked' : ''}" data-world="${i}" ${i === level.world ? 'aria-current="true"' : ''}><span class="world-art">${art(world.icon)}</span><span class="world-copy"><strong>${world.name}</strong><span>第 ${i * 20 + 1}–${i * 20 + 20} 关</span></span><span class="world-mark">${locked ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-label="尚未解锁"><rect x="6" y="10" width="12" height="10" rx="3"/><path d="M9 10V7a3 3 0 016 0v3"/></svg>' : done === 20 ? '✓' : i === level.world ? '●' : '›'}</span></button>`;
  }).join('');
  const total = save.stars.filter(Boolean).length;
  $('#total-progress').textContent = `${total} / 100 关`;
  $('#progress-fill').style.width = total + '%';
}
function render() {
  const collected = level.carrots.filter((_, i) => run.mask & (1 << i)).length;
  $('#carrot-count').textContent = `${collected} / ${level.carrots.length}`;
  $('#move-count').textContent = run.moves;
  $('#undo').disabled = !run.moves;
  const best = save.stars[level.number - 1];
  $('#level-stars').textContent = '★'.repeat(best) + '☆'.repeat(3 - best);
  $('#level-stars').ariaLabel = `本关已获得 ${best} 颗星`;
  const adjacent = neighbors(level, run.pos);
  $('#key-inventory').innerHTML = level.keys.map((_, i) => `<span class="key-status ${run.keys & (1 << i) ? 'owned' : ''}" style="--key-color:${i ? '#799bbf' : '#d9aa4e'}">${art('key')} ${run.keys & (1 << i) ? '已拿到' : '待寻找'}</span>`).join('');
  $('#step-budget').classList.toggle('over-goal', run.moves > Math.ceil(level.optimal * 1.2));
  $('#board').innerHTML = level.cells.map((cell, pos) => {
    if (!cell) return `<span class="tile hedge hedge-${pos % 3}" aria-hidden="true"><span>${pos % 7 === 0 ? '✿' : ''}</span></span>`;
    const carrot = level.carrots.indexOf(pos), hasCarrot = carrot >= 0 && !(run.mask & (1 << carrot));
    const bunny = pos === run.pos, home = pos === level.exit, hinted = pos === hintPos, next = adjacent.find(n => n.pos === pos);
    const keyIndex = level.keys.indexOf(pos), doorIndex = level.doors.indexOf(pos);
    const hasKey = keyIndex >= 0 && !(run.keys & (1 << keyIndex)), lockedDoor = doorIndex >= 0 && !(run.keys & (1 << doorIndex));
    const nextCarrot = level.carrots.findIndex((_, i) => !(run.mask & (1 << i)));
    const label = [hasKey ? (keyIndex ? '蓝色钥匙' : '金色钥匙') : '', lockedDoor ? (doorIndex ? '蓝色木门，需要蓝钥匙' : '金色木门，需要金钥匙') : '', bunny ? '小兔' : '', home ? '小屋' : '', hasCarrot ? (level.ordered ? '第 ' + (carrot + 1) + ' 根胡萝卜' : '胡萝卜') : '', hinted ? '提示：走这里' : ''].filter(Boolean).join('，') || '小路';
    return `<button type="button" tabindex="-1" class="tile path ${home ? 'home-tile' : ''} ${hinted ? 'hinted' : ''} ${bunny ? 'bunny-tile' : ''}" data-pos="${pos}" aria-label="第 ${Math.floor(pos / level.size) + 1} 行第 ${pos % level.size + 1} 列，${label}">${home ? art('home', 'home-art') : ''}${hasCarrot ? art('carrot', 'carrot-art') + (level.ordered ? `<span class="carrot-number ${carrot === nextCarrot ? 'next-target' : ''}">${carrot + 1}</span>` : '') : ''}${hasKey ? `<span class="key-art" style="--key-color:${keyIndex ? '#799bbf' : '#d9aa4e'}">${art('key')}</span>` : ''}${doorIndex >= 0 ? `<span class="door-art ${lockedDoor ? '' : 'opened'}" style="--key-color:${doorIndex ? '#799bbf' : '#d9aa4e'}">${art('door')}</span>` : ''}${bunny ? art('bunny', 'player') : ''}${hinted ? '<span class="hint-ring"></span>' : ''}${!bunny && !home && !hasCarrot && !hasKey && doorIndex < 0 && next ? '<span class="path-dot"></span>' : ''}</button>`;
  }).join('');
  $('#board').ariaLabel = `第 ${level.number} 关迷宫，小兔在第 ${Math.floor(run.pos / level.size) + 1} 行第 ${run.pos % level.size + 1} 列。已收集 ${collected} 根胡萝卜，共 ${level.carrots.length} 根。使用方向键移动。`;
}
function walk(direction) {
  if (won || document.querySelector('dialog[open]')) return;
  const next = move(level, run, direction);
  if (next === run) {
    const target = neighbors(level, run.pos).find(n => n.direction === direction), gate = target ? level.doors.indexOf(target.pos) : -1;
    const message = gate >= 0 ? `木门锁着呢，先找${gate ? '蓝色' : '金色'}钥匙！` : '这里过不去，换个方向试试吧';
    $('#board-caption').textContent = message; say(message); return;
  }
  const picked = next.mask !== run.mask, gotKey = next.keys !== run.keys;
  run = next; hintPos = -1; render(); persist();
  if (picked) { tone('carrot'); $('#buddy-title').textContent = '找到胡萝卜啦！'; $('#buddy-message').textContent = run.mask === (1 << level.carrots.length) - 1 ? '已经集齐啦！现在带我回小屋吧。' : '收进小背包，继续找找剩下的吧。'; say($('#buddy-message').textContent); }
  else tone('step');
  $('#board-caption').textContent = run.pos === level.exit && !isWon(level, run) ? '还有胡萝卜没带上，先去找找吧' : picked ? '太棒啦！又有一个小小收获' : '每一小步，都在发现新东西';
  if (gotKey) { tone('carrot'); $('#board-caption').textContent = '拿到钥匙了！同色的木门可以通过啦'; say($('#board-caption').textContent); }
  const waiting = level.carrots.indexOf(run.pos);
  if (level.ordered && waiting >= 0 && !(run.mask & (1 << waiting))) { $('#board-caption').textContent = `先收集第 ${level.carrots.findIndex((_, i) => !(run.mask & (1 << i))) + 1} 根胡萝卜，再回来拿这根`; say($('#board-caption').textContent); }
  if (isWon(level, run)) complete();
}
function complete() {
  won = true; const stars = starsFor(level, run.moves);
  save.stars[level.number - 1] = Math.max(save.stars[level.number - 1], stars);
  save.unlocked = Math.max(save.unlocked, Math.min(100, level.number + 1));
  persist(); drawWorlds(); render(); tone('win');
  const end = level.number === 100;
  $('#win-stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  $('#win-stars').ariaLabel = `获得 ${stars} 颗星`;
  $('#win-title').textContent = end ? '100 关，全部走过啦！' : '胡萝卜带回家啦！';
  $('#win-message').textContent = end ? '每一次观察和尝试，都让你成为更棒的探险家。' : stars === 3 ? '观察得真仔细！米米给你一个大大的拥抱。' : '愿意尝试的你，真棒！每一次探索都有收获。';
  $('#win-summary').textContent = `收集 ${level.carrots.length} 根胡萝卜 · 走了 ${run.moves} 步`;
  $('#next-level').innerHTML = end ? '看看我的 100 关足迹' : level.number % 20 === 0 ? `出发，去${WORLDS[level.world + 1].name}！ →` : '出发，下一关！ →';
  $('#win-dialog').showModal(); say($('#win-title').textContent);
}
function drawMap() {
  $('#map-tabs').innerHTML = WORLDS.map((world, i) => `<button class="map-tab ${mapWorld === i ? 'selected' : ''}" data-tab="${i}" aria-pressed="${mapWorld === i}">${art(world.icon)}<span>${world.name}</span></button>`).join('');
  $('#map-description').textContent = WORLDS[mapWorld].sub;
  $('#level-grid').innerHTML = Array.from({ length: 20 }, (_, i) => {
    const num = mapWorld * 20 + i + 1, stars = save.stars[num - 1], locked = num > save.unlocked;
    return `<button class="level-button ${num === level.number ? 'current' : ''}" data-level="${num}" ${locked ? 'disabled' : ''} aria-label="第 ${num} 关，${locked ? '尚未解锁' : stars ? stars + ' 颗星' : '可以挑战'}"><strong>${num}</strong><span>${locked ? '待解锁' : stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '出发'}</span></button>`;
  }).join('');
}
function openMap(world = level.world) { mapWorld = world; drawMap(); $('#map-dialog').showModal(); }
$('#world-list').addEventListener('click', e => { const el = e.target.closest('[data-world]'); if (el) openMap(Number(el.dataset.world)); });
$('#open-map').onclick = () => openMap();
$('#map-tabs').addEventListener('click', e => { const el = e.target.closest('[data-tab]'); if (el) { mapWorld = Number(el.dataset.tab); drawMap(); } });
$('#level-grid').addEventListener('click', e => { const el = e.target.closest('[data-level]'); if (el && !el.disabled) { $('#map-dialog').close(); loadLevel(Number(el.dataset.level)); } });
$('#help').onclick = () => $('#help-dialog').showModal();
document.querySelectorAll('.close-dialog').forEach(el => el.onclick = () => el.closest('dialog').close());
$('#sound').onclick = () => { save.sound = !save.sound; updateSound(); persist(); tone('carrot'); };
document.querySelectorAll('[data-direction]').forEach(el => el.onclick = () => walk(el.dataset.direction));
$('#board').addEventListener('click', e => { const el = e.target.closest('[data-pos]'); if (!el) return; const next = neighbors(level, run.pos).find(n => n.pos === Number(el.dataset.pos)); if (next) walk(next.direction); else if (Number(el.dataset.pos) !== run.pos) { $('#board-caption').textContent = '一步一步来，点小兔旁边的小路'; say('一步一步来，点小兔旁边的小路'); } });
document.addEventListener('keydown', e => {
  if (document.querySelector('dialog[open]') || e.ctrlKey || e.metaKey || e.altKey) return;
  const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }[e.key];
  if (direction) { e.preventDefault(); walk(direction); }
});
let touch;
$('#board').addEventListener('touchstart', e => { if (e.touches.length === 1) touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
$('#board').addEventListener('touchend', e => { if (!touch) return; const dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y; touch = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; e.preventDefault(); walk(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up'); }, { passive: false });
$('#board').addEventListener('touchcancel', () => { touch = null; });
$('#undo').onclick = () => { if (won) return; run = undo(run); hintPos = -1; render(); persist(); $('#board-caption').textContent = '退一步，再想一想'; };
$('#restart').onclick = () => loadLevel(level.number);
$('#hint').onclick = () => {
  if (won) return;
  const direction = solve(level, run)[0], next = neighbors(level, run.pos).find(n => n.direction === direction);
  if (!next) return;
  hintPos = next.pos; render();
  const message = `试试向${{ up: '上', down: '下', left: '左', right: '右' }[direction]}走一步，发光的格子在等你。`;
  $('#buddy-title').textContent = '米米的小提示'; $('#buddy-message').textContent = message; $('#board-caption').textContent = message; say(message);
};
$('#next-level').onclick = () => { $('#win-dialog').close(); if (level.number === 100) openMap(4); else loadLevel(level.number + 1); };
$('#replay').onclick = () => { $('#win-dialog').close(); loadLevel(level.number); };
$('#win-map').onclick = () => { $('#win-dialog').close(); openMap(); };
$('#win-dialog').addEventListener('cancel', e => { e.preventDefault(); $('#win-dialog').close(); openMap(); });
updateSound(); loadLevel(save.level, save.path);
