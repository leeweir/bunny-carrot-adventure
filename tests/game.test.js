import test from 'node:test';
import assert from 'node:assert/strict';
import { makeLevel, freshRun, move, undo, solve, isWon, starsFor, normalizeSave, neighbors, transition } from '../game.js';

test('100 distinct, deterministic levels: every carrot reachable, every optimal solution wins', () => {
  const layouts = new Set();
  for (let number = 1; number <= 100; number++) {
    const level = makeLevel(number);
    assert.deepEqual(makeLevel(number), level);
    assert.equal(new Set(level.carrots).size, level.carrots.length);
    const key = JSON.stringify([level.cells, level.carrots, level.exit]);
    assert.ok(!layouts.has(key), `Level ${number} must be unique`); layouts.add(key);
    assert.ok(level.optimal > 0);
    assert.equal(level.keys.length, number >= 41 ? 2 : 1);
    assert.equal(level.doors.length, level.keys.length);
    assert.equal(level.ordered, number >= 21);
    assert.ok(level.carrots.length >= 3);
    assert.equal(new Set([level.start, level.exit, ...level.carrots, ...level.keys, ...level.doors]).size, 2 + level.carrots.length + level.keys.length + level.doors.length);
    assert.ok(level.carrots.every(p => level.cells[p] && p !== level.start && p !== level.exit));
    let run = freshRun(level);
    const route = solve(level, run);
    assert.equal(route.length, level.optimal);
    const crossed = new Set();
    for (const direction of route) {
      const next = move(level, run, direction);
      assert.notEqual(next, run, `Valid move at level ${number}`);
      run = next;
      if (level.doors.includes(run.pos)) crossed.add(run.pos);
    }
    assert.ok(isWon(level, run), `Level ${number} solvable`);
    assert.equal(crossed.size, level.doors.length, 'Every gate participates in the solution');
    assert.equal(run.keys, (1 << level.keys.length) - 1);
    assert.equal(starsFor(level, run.moves), 3);
    assert.equal(move(level, run, 'up'), run, 'Winning state does not move');
    assert.ok(!isWon(level, undo(run)), 'Undo restores pre-win state');
  }
});

test('hints find a valid full solution after detours, undo restores carrots, walls do not count', () => {
  for (const number of [1, 20, 21, 40, 41, 60, 61, 80, 81, 100]) {
    const level = makeLevel(number); let run = freshRun(level);
    assert.equal(move(level, run, 'up'), run);
    assert.equal(move(level, run, 'left'), run);
    for (let i = 0; i < 24 && !isWon(level, run); i++) {
      const options = neighbors(level, run.pos).filter(n => transition(level, run, n.direction)), previous = run;
      run = move(level, run, options[(i * 7) % options.length].direction);
      assert.deepEqual(undo(run), previous);
    }
    for (const direction of solve(level, run)) run = move(level, run, direction);
    assert.ok(isWon(level, run));
  }
});

test('saved runs replay exactly and malformed storage cannot unlock arbitrary levels', () => {
  assert.deepEqual(normalizeSave(null), { stars: Array(100).fill(0), unlocked: 1, level: 1, path: [], sound: false });
  const corrupted = normalizeSave({ level: 99, stars: [9, -1, '3'], path: ['left', 'constructor', 'bad', 0, 'down'] });
  assert.equal(corrupted.level, 1); assert.equal(corrupted.unlocked, 1);
  assert.deepEqual(corrupted.path, ['left', 'down']);
  const stars = Array(100).fill(0); stars.fill(3, 0, 27);
  assert.equal(normalizeSave({ stars }).unlocked, 28);
  const level = makeLevel(28); let run = freshRun(level);
  for (const direction of solve(level).slice(0, 7)) run = move(level, run, direction);
  const restored = normalizeSave(JSON.parse(JSON.stringify({ stars, level: 28, path: run.history.map(h => h.direction) })));
  let replay = freshRun(level);
  for (const direction of restored.path) replay = move(level, replay, direction);
  assert.deepEqual(replay, run);
  assert.equal(normalizeSave({ stars: Array(100).fill(3), level: 100 }).unlocked, 100);
});

test('collecting all carrots is required even after reaching the house', () => {
  const level = { size: 3, cells: Array(9).fill(1), start: 0, exit: 1, carrots: [8] };
  let run = move(level, freshRun(level), 'right');
  assert.equal(run.pos, level.exit); assert.equal(isWon(level, run), false);
  for (const direction of solve(level, run)) run = move(level, run, direction);
  assert.equal(isWon(level, run), true);
  assert.throws(() => makeLevel(0), RangeError);
  assert.throws(() => makeLevel(101), RangeError);
});


test('keys unlock only the matching door; undo restores the key and lock state', () => {
  const level = { size: 3, cells: Array(9).fill(1), start: 0, exit: 8, carrots: [6], keys: [3, 4], doors: [1, 2] };
  let run = freshRun(level);
  assert.equal(move(level, run, 'right'), run, 'Gold door blocks without gold key');
  const beforeKey = run; run = move(level, run, 'down');
  assert.equal(run.keys, 1); assert.deepEqual(undo(run), beforeKey);
  run = move(level, run, 'up'); run = move(level, run, 'right');
  assert.equal(run.pos, 1);
  assert.equal(move(level, run, 'right'), run, 'Gold key cannot open blue door');
  run = move(level, run, 'down'); assert.equal(run.keys, 3);
  run = move(level, run, 'up'); run = move(level, run, 'right'); assert.equal(run.pos, 2);
});

test('numbered carrots require sequence; passing a later carrot does not collect it', () => {
  const level = { size: 3, cells: Array(9).fill(1), start: 0, exit: 8, carrots: [3, 1, 5], keys: [], doors: [], ordered: true };
  let run = move(level, freshRun(level), 'right');
  assert.equal(run.mask, 0);
  for (const direction of solve(level, run)) run = move(level, run, direction);
  assert.ok(isWon(level, run)); assert.equal(run.mask, 7);
});
