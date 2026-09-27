export const WORLDS = [
  { name: '青草小径', sub: '先找钥匙，再规划收集路线', icon: 'meadow', color: '#72ad69', size: 7, carrots: 3 },
  { name: '蘑菇森林', sub: '按照数字顺序收集胡萝卜', icon: 'mushroom', color: '#bd8270', size: 7, carrots: 4 },
  { name: '蓝莓海湾', sub: '两把钥匙，两扇不同颜色的门', icon: 'wave', color: '#69a8c6', size: 9, carrots: 4 },
  { name: '奶油雪山', sub: '多绕一点，也没关系', icon: 'mountain', color: '#9c9cce', size: 9, carrots: 5 },
  { name: '星光花园', sub: '小小路线规划师', icon: 'star', color: '#a389ce', size: 11, carrots: 6 }
];
export const DIRECTIONS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function random(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function neighbors(level, pos) {
  const x = pos % level.size, y = Math.floor(pos / level.size);
  return Object.entries(DIRECTIONS).flatMap(([direction, [dx, dy]]) => {
    const nx = x + dx, ny = y + dy, p = ny * level.size + nx;
    return nx >= 0 && ny >= 0 && nx < level.size && ny < level.size && level.cells[p] ? [{ pos: p, direction }] : [];
  });
}
const levelCache = [], layoutKeys = new Set();
export function makeLevel(number) {
  if (!Number.isInteger(number) || number < 1 || number > 100) throw new RangeError('关卡应为 1–100');
  while (levelCache.length < number) {
    const nextNumber = levelCache.length + 1;
    let attempt = 0, level, key;
    do {
      level = generateLevel(nextNumber, attempt++);
      key = JSON.stringify([level.cells, level.carrots, level.exit, level.keys, level.doors]);
    } while (!level.optimal || level.keys.length < (level.world >= 2 ? 2 : 1) || layoutKeys.has(key));
    layoutKeys.add(key); levelCache.push(level);
  }
  return structuredClone(levelCache[number - 1]);
}
function generateLevel(number, attempt) {
  const world = Math.floor((number - 1) / 20), spec = WORLDS[world], size = spec.size;
  const rng = random(number * 7907 + 42 + attempt * 104729), cells = Array(size * size).fill(0), stack = [0];
  cells[0] = 1;
  while (stack.length) {
    const p = stack.at(-1), x = p % size, y = Math.floor(p / size);
    const options = Object.values(DIRECTIONS).map(([dx, dy]) => [x + dx * 2, y + dy * 2, dx, dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < size && ny < size && !cells[ny * size + nx]);
    if (!options.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = options[Math.floor(rng() * options.length)];
    cells[(y + dy) * size + x + dx] = 1;
    cells[ny * size + nx] = 1; stack.push(ny * size + nx);
  }
  // Later chapters add loops, giving children multiple possible routes.
  const loops = 2 + world + Math.floor(((number - 1) % 20) / 7);
  const walls = cells.map((v, p) => p).filter(p => !cells[p] && ((p % size % 2 === 0) !== (Math.floor(p / size) % 2 === 0)));
  for (let i = 0; i < loops && walls.length; i++) cells[walls.splice(Math.floor(rng() * walls.length), 1)[0]] = 1;
  const level = { number, world, size, cells, start: 0, exit: 0, carrots: [], keys: [], doors: [], ordered: world >= 1 };
  const distance = new Map([[0, 0]]), queue = [0];
  for (let i = 0; i < queue.length; i++) for (const next of neighbors(level, queue[i])) if (!distance.has(next.pos)) { distance.set(next.pos, distance.get(queue[i]) + 1); queue.push(next.pos); }
  level.exit = queue.at(-1);
  // Place a gate on a bottleneck and its key on the reachable side.
  // Later chapters add a second gate. The full state solver rejects deadlocks.
  const gates = world >= 2 ? 2 : 1;
  const candidates = queue.filter(p => p !== 0 && p !== level.exit);
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  for (const gate of candidates) {
    if (level.doors.length >= gates) break;
    if (level.keys.includes(gate)) continue;
    const blocked = new Set([...level.doors, gate]), reachable = [0], seen = new Set([0]);
    for (let i = 0; i < reachable.length; i++) for (const next of neighbors(level, reachable[i])) {
      if (!blocked.has(next.pos) && !seen.has(next.pos)) { seen.add(next.pos); reachable.push(next.pos); }
    }
    if (seen.has(level.exit)) continue;
    const places = reachable.filter(p => p !== 0 && !level.keys.includes(p) && !level.doors.includes(p));
    if (places.length < 3) continue;
    level.doors.push(gate); level.keys.push(places[Math.floor(rng() * places.length)]);
  }
  const targets = queue.filter(p => p !== 0 && p !== level.exit && !level.keys.includes(p) && !level.doors.includes(p))
    .map(p => ({ p, score: (neighbors(level, p).length === 1 ? 2 : 0) + rng() }));
  targets.sort((a, b) => b.score - a.score);
  level.carrots = targets.slice(0, spec.carrots).map(c => c.p);
  const route = solve(level), crossed = new Set();
  let state = freshRun(level);
  for (const direction of route) {
    state = transition(level, state, direction);
    if (level.doors.includes(state.pos)) crossed.add(state.pos);
  }
  // Every gate must matter to the solution, including the second color.
  level.optimal = crossed.size === gates ? route.length : 0;
  return level;
}
export function freshRun(level) { return { pos: level.start, mask: 0, keys: 0, moves: 0, history: [] }; }
export function isWon(level, run) { return run.pos === level.exit && run.mask === (1 << level.carrots.length) - 1; }
export function transition(level, run, direction) {
  const next = neighbors(level, run.pos).find(n => n.direction === direction);
  if (!next) return null;
  const door = (level.doors || []).indexOf(next.pos);
  if (door >= 0 && !((run.keys || 0) & (1 << door))) return null;
  const key = (level.keys || []).indexOf(next.pos), carrot = level.carrots.indexOf(next.pos);
  let mask = run.mask;
  if (carrot >= 0 && (!level.ordered || (mask & ((1 << carrot) - 1)) === (1 << carrot) - 1)) mask |= 1 << carrot;
  return { pos: next.pos, mask, keys: (run.keys || 0) | (key < 0 ? 0 : 1 << key) };
}
export function move(level, run, direction) {
  if (isWon(level, run)) return run;
  const next = transition(level, run, direction);
  if (!next) return run;
  return { ...next, moves: run.moves + 1, history: [...run.history, { pos: run.pos, mask: run.mask, keys: run.keys || 0, direction }] };
}
export function undo(run) {
  if (!run.history.length) return run;
  const last = run.history.at(-1);
  return { pos: last.pos, mask: last.mask, keys: last.keys, moves: run.moves - 1, history: run.history.slice(0, -1) };
}
export function solve(level, run = freshRun(level)) {
  const fullMask = (1 << level.carrots.length) - 1, keyStates = 1 << (level.keys || []).length;
  const encode = (pos, mask, keys) => (pos * (fullMask + 1) + mask) * keyStates + (keys || 0);
  const start = encode(run.pos, run.mask, run.keys), queue = [{ pos: run.pos, mask: run.mask, keys: run.keys || 0, code: start }], previous = new Map([[start, null]]);
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    if (current.pos === level.exit && current.mask === fullMask) {
      const route = []; for (let code = current.code; previous.get(code);) { const prev = previous.get(code); route.unshift(prev.direction); code = prev.code; } return route;
    }
    for (const direction of Object.keys(DIRECTIONS)) {
      const next = transition(level, current, direction);
      if (!next) continue;
      const code = encode(next.pos, next.mask, next.keys);
      if (previous.has(code)) continue;
      previous.set(code, { code: current.code, direction }); queue.push({ ...next, code });
    }
  }
  return [];
}
export function starsFor(level, moves) { return moves <= Math.ceil(level.optimal * 1.2) ? 3 : moves <= Math.ceil(level.optimal * 1.8) ? 2 : 1; }
export function normalizeSave(raw) {
  const stars = Array.from({ length: 100 }, (_, i) => Number.isInteger(raw?.stars?.[i]) && raw.stars[i] >= 0 && raw.stars[i] <= 3 ? raw.stars[i] : 0);
  let unlocked = 1; while (unlocked < 100 && stars[unlocked - 1] > 0) unlocked++;
  const level = Number.isInteger(raw?.level) && raw.level >= 1 && raw.level <= unlocked ? raw.level : unlocked;
  const path = Array.isArray(raw?.path) ? raw.path.slice(0, 10000).filter(d => Object.hasOwn(DIRECTIONS, d)) : [];
  return { stars, unlocked, level, path, sound: raw?.sound === true };
}
