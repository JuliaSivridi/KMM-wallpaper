// Actions that can be toggled: globally (the ✋ button in the family list) and per person (the "Settings" panel).
// A person performs an action only if it is enabled both for their age group and for them personally.
// Each action has a single global switch (for everyone who can do it); it is stored in the browser like the coordinates. Per-person switches live in the person's actions field, i.e. in the family file: { "shovel": true, "chop": false }.
// No field or no key — the action is enabled.
const ACTIONS = [
  { id: 'shovel',  ages: ['adult'],          icon: '🧹', name: 'Clear the path',   seasons: ['winter'] },
  { id: 'chop',    ages: ['adult'],          icon: '🪓', name: 'Chop firewood',    seasons: ['winter', 'spring', 'autumn'] },
  { id: 'snowman', ages: ['child'],          icon: '⛄', name: 'Build a snowman',  seasons: ['winter'] },
  { id: 'cones',   ages: ['child'],          icon: '🌰', name: 'Collect cones',    seasons: ['autumn'] },
  { id: 'berries', ages: ['adult', 'child'], icon: '🫐', name: 'Pick berries',     seasons: ['summer', 'autumn'] },
  { id: 'fire',    ages: ['adult', 'child'], icon: '🔥', name: 'Sit by the fire',  seasons: [] },
];
const ACT_GROUPS = [['adult', 'Adults'], ['child', 'Children'], ['all', 'Everyone']];
const actionGroup = d => d.ages.length > 1 ? 'all' : d.ages[0];
const SEASON_ICON = { winter: '⛄', spring: '🌱', summer: '🌻', autumn: '🍂' };
// character mode (a.mode) → the action it performs
const ACTION_MODE = { build: 'snowman', shovel: 'shovel', chop: 'chop', cones: 'cones', pick: 'berries' };
const ACT_KEY = 'forest.actions.v1';

let ACT_OFF = {};   // { shovel: true } — the action is disabled for everyone
try { const o = JSON.parse(localStorage.getItem(ACT_KEY) || 'null'); if (o && typeof o === 'object') ACT_OFF = o; } catch (e) {}
function saveActionOff() { try { localStorage.setItem(ACT_KEY, JSON.stringify(ACT_OFF)); } catch (e) {} }

const actionsFor = age => ACTIONS.filter(d => d.ages.includes(age));
const actionOnGlobal = id => !ACT_OFF[id];
// The full list of actions for a person (by their age) as { id: true/false }.
function personActions(p) {
  const o = {};
  for (const d of actionsFor(p.age)) o[d.id] = !(p.actions && p.actions[d.id] === false);
  return o;
}
function canDo(p, id) {
  return actionsFor(p.age).some(d => d.id === id) && actionOnGlobal(id) && !(p.actions && p.actions[id] === false);
}