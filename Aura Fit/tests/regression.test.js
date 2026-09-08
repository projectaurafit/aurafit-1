const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function storage() {
  const values = new Map();
  return {
    fail: false,
    getItem: key => values.get(key) || null,
    setItem(key, value) {
      if (this.fail) throw new Error('QuotaExceededError');
      values.set(key, value);
    },
    removeItem: key => values.delete(key)
  };
}
function store(disk = storage()) {
  const messages = [];
  const window = {
    addEventListener() {},
    UI: { toast: message => messages.push(message) },
    Data: {
      WARDROBE: [{ id: 'seed', name: 'Starter', cat: 'top' }],
      OUTFITS: [{ id: 'look', items: ['seed'], fav: true }], CATEGORIES: []
    }
  };
  const context = vm.createContext({ window, localStorage: disk, console });
  vm.runInContext(read('js/store.js'), context);
  window.Store.load();
  return { S: window.Store, disk, messages, context, window };
}
const signup = (S, email) => assert.equal(S.register(email, email, 'DemoPass123!').ok, true);

function adminStore() {
  const f = store();
  f.context.document = { body: null, addEventListener() {} };
  vm.runInContext(read('js/screens/admin.js'), f.context);
  f.S.login('admin@aurafit.app', 'Admin@123');
  f.A = f.window.Admin.store;
  f.A.ensure();
  return f;
}

test('admin creates an account without changing its own session or wardrobe', () => {
  const { S, A, disk } = adminStore();
  S.addItem({name:'Admin only',cat:'top'});
  A.saveSettings({allowSignups:false});
  A.createUser('New Member','MEMBER@example.com','Member@123','user');
  assert.equal(S.user().email,'admin@aurafit.app');
  assert.ok(S.state.wardrobe.some(i => i.name === 'Admin only'));
  assert.throws(() => A.createUser('Duplicate','member@example.com','Member@123','user'), /already exists/);
  const reload = store(disk).S;
  assert.equal(reload.login('member@example.com','Member@123').ok,true);
  assert.equal(reload.user().onboarded,false);
  assert.ok(!reload.state.wardrobe.some(i => i.name === 'Admin only'));
});

test('admin passwords require current credentials and persist across reload', () => {
  const { S, A, disk } = adminStore();
  assert.throws(() => A.setPassword('admin@aurafit.app','NewOwner@123','wrong'), /incorrect/);
  assert.equal(S.user().pass,'Admin@123');
  A.setPassword('admin@aurafit.app','NewOwner@123','Admin@123');
  const reload = store(disk).S;
  assert.equal(reload.login('admin@aurafit.app','Admin@123').ok,false);
  assert.equal(reload.login('admin@aurafit.app','NewOwner@123').ok,true);
});

test('owner cannot be suspended, demoted or deleted by another administrator', () => {
  const { S, A } = adminStore();
  A.createUser('Second Admin','second@example.com','Second@123','admin');
  S.login('second@example.com','Second@123');
  assert.throws(() => A.updateUser('admin@aurafit.app',{status:'suspended'}), /protected/);
  assert.throws(() => A.updateUser('admin@aurafit.app',{role:'user'}), /protected/);
  assert.throws(() => A.deleteUser('admin@aurafit.app'), /cannot be deleted/);
  assert.throws(() => A.setPassword('admin@aurafit.app','Replaced@123','Second@123'), /Only the owner/);
  assert.throws(() => A.updateUser('second@example.com',{role:'user'}), /protected/);
});

test('admin mutations reject signed-out and ordinary user callers', () => {
  const { S, A } = adminStore();
  for (const user of ['guest','user']) {
    if (user === 'guest') S.logout(); else S.login('user@aurafit.app','User@123');
    assert.throws(() => A.saveSettings({maintenance:true}), /administrator/);
    assert.throws(() => A.createUser('No Access','no@example.com','NoAccess@123','admin'), /administrator/);
    assert.throws(() => A.updateUser('admin@aurafit.app',{name:'Changed'}), /administrator/);
    assert.throws(() => A.deleteUser('admin@aurafit.app'), /administrator/);
  }
});

test('failed admin saves roll back accounts, passwords and configuration', () => {
  const { S, A, disk } = adminStore();
  disk.fail = true;
  assert.throws(() => A.createUser('Failed User','failed@example.com','Failed@123','user'), /Could not save/);
  assert.equal(S.state.users['failed@example.com'],undefined);
  assert.throws(() => A.setPassword('admin@aurafit.app','NewOwner@123','Admin@123'), /Could not save/);
  assert.equal(S.user().pass,'Admin@123');
  assert.throws(() => A.saveSettings({maintenance:true}), /Could not save/);
  assert.equal(S.state.adminSettings.maintenance,false);
});

test('libraries, favourites and plans are isolated and survive reload', () => {
  const { S, disk } = store();
  signup(S, 'alice@example.com');
  const item = S.addItem({ name: 'Private', cat: 'top' });
  S.toggleSavedProduct('product-a');
  S.setPlan('2026-09-05', 'look');
  S.logout();
  assert.equal(S.state.wardrobe.length, 0);
  signup(S, 'bob@example.com');
  assert.equal(S.getItem(item.id), null);
  assert.equal(S.isSavedProduct('product-a'), false);
  assert.equal(S.planFor('2026-09-05'), null);
  const restored = store(disk).S;
  restored.login('alice@example.com', 'DemoPass123!');
  assert.equal(restored.getItem(item.id).name, 'Private');
  assert.equal(restored.isSavedProduct('product-a'), true);
  assert.equal(restored.planFor('2026-09-05').id, 'look');
  assert.equal('wardrobe' in JSON.parse(disk.getItem('aurafit.v1')), false);
});

test('legacy shared data migrates only to its last signed-in owner', () => {
  const disk = storage();
  disk.setItem('aurafit.v1', JSON.stringify({
    session: { email: 'alice@example.com' },
    users: { 'alice@example.com': { name: 'Alice', email: 'alice@example.com', pass: 'DemoPass123!' } },
    wardrobe: [{ id: 'private' }], outfits: [], seeded: true
  }));
  const { S } = store(disk);
  assert.ok(S.getItem('private'));
  signup(S, 'bob@example.com');
  assert.equal(S.getItem('private'), null);
  S.login('alice@example.com', 'DemoPass123!');
  assert.ok(S.getItem('private'));
});

test('unowned legacy data is preserved without exposing it to new accounts', () => {
  const disk = storage();
  disk.setItem('aurafit.v1', JSON.stringify({ wardrobe: [{ id: 'legacy' }], seeded: true }));
  const { S } = store(disk);
  signup(S, 'bob@example.com');
  assert.equal(S.getItem('legacy'), null);
  assert.equal(S.state.legacyLibrary.wardrobe[0].id, 'legacy');
});

test('a stale tab cannot overwrite newer changes, including unrelated settings', () => {
  const { S: first, disk } = store();
  signup(first, 'alice@example.com');
  const second = store(disk).S;
  const item = first.addItem({ name: 'New item' });
  second.state.theme = 'dark';
  assert.throws(() => second.save(), /Another tab/);
  assert.equal(second.state.theme, null);
  assert.ok(store(disk).S.getItem(item.id));
  second.load();
  second.state.theme = 'dark';
  second.save();
  assert.ok(store(disk).S.getItem(item.id));
});

test('quota failure rolls back state, notifies user and prevents success', () => {
  const { S, disk, messages } = store();
  signup(S, 'alice@example.com');
  const before = JSON.stringify(S.state);
  disk.fail = true;
  assert.throws(() => S.addItem({ name: 'Lost photo' }), /Could not save/);
  assert.equal(JSON.stringify(S.state), before);
  assert.match(messages.at(-1), /Could not save/);
  assert.equal(S.register('Bob', 'bob@example.com', 'DemoPass123!').ok, false);
  disk.fail = false;
  assert.equal(store(disk).S.state.users['bob@example.com'], undefined);
  assert.ok(S.addItem({ name: 'Retry' }));
});

test('resetting one library preserves accounts, other libraries and clean seed templates', () => {
  const { S } = store();
  signup(S, 'alice@example.com');
  S.removeItem('seed');
  S.resetLibrary();
  assert.equal(S.getOutfit('look').items[0], 'seed');
  const item = S.addItem({ name: 'Alice item' });
  signup(S, 'bob@example.com');
  S.resetLibrary();
  S.login('alice@example.com', 'DemoPass123!');
  assert.ok(S.getItem(item.id));
  assert.ok(S.state.users['bob@example.com']);
});

test('full reset removes custom accounts and libraries', () => {
  const { S, disk } = store();
  signup(S, 'alice@example.com');
  S.addItem({ name: 'Private' });
  S.resetAll();
  const restored = store(disk).S;
  assert.equal(restored.user(), null);
  assert.equal(restored.state.users['alice@example.com'], undefined);
  assert.equal(Object.keys(restored.state.libraries).length, 0);
});

test('removing the final outfit piece clears dangling favourites and calendar plans', () => {
  const { S } = store();
  signup(S, 'alice@example.com');
  if (!S.isFavOutfit('look')) S.toggleFavOutfit('look');
  S.setPlan('2026-09-05', 'look');
  S.removeItem('seed');
  assert.equal(S.getOutfit('look'), null);
  assert.equal(S.isFavOutfit('look'), false);
  assert.equal(S.planFor('2026-09-05'), null);
  assert.equal(Object.values(S.state.planner).includes('look'), false);
});

test('simulated recovery and Google sign-in cannot alter or access accounts', () => {
  const { S } = store();
  assert.equal(S.adminLogin().ok, false);
  assert.equal(S.user(), null);
  assert.equal(S.resetPassword('admin@aurafit.app', 'Changed123!').ok, false);
  assert.equal(S.socialLogin('google').ok, false);
  assert.equal(S.login('admin@aurafit.app', 'Admin@123').ok, true);
});

test('paused signups reject registration without creating accounts or sessions', () => {
  const { S, disk } = store();
  S.state.adminSettings = { allowSignups: false };
  S.save();
  const before = disk.getItem('aurafit.v1');
  assert.equal(S.register('Paused', 'paused@example.com', 'DemoPass123!').ok, false);
  assert.equal(S.state.users['paused@example.com'], undefined);
  assert.equal(S.user(), null);
  assert.equal(disk.getItem('aurafit.v1'), before);
});

test('maintenance blocks user sign-in and signup while allowing admin access', () => {
  const { S } = store();
  S.state.adminSettings = { maintenance: true, allowSignups: true };
  S.save();
  assert.equal(S.login('user@aurafit.app', 'User@123').ok, false);
  assert.equal(S.user(), null);
  assert.equal(S.register('Paused', 'paused@example.com', 'DemoPass123!').ok, false);
  assert.equal(S.state.users['paused@example.com'], undefined);
  assert.equal(S.login('admin@aurafit.app', 'Admin@123').ok, true);
  assert.equal(S.user().role, 'admin');
});

// A minimal DOM fixture exercises the real routers and UI.on listener helper.
// It deliberately preserves listeners on innerHTML assignments, as browsers do.
function routerFixture(file) {
  const nodes = {};
  class Element {
    constructor() { this.listeners = []; this.dataset = {}; this.classList = { toggle() {} }; }
    addEventListener(type, fn) { this.listeners.push(fn); }
    setAttribute(name, value) { this[name] = value; }
    querySelector() { return null; }
    contains() { return true; }
    cloneNode() { return new Element(); }
    replaceWith(node) { nodes['[data-view]'] = node; }
    appendChild(node) { this.firstElementChild = node; }
    click() { this.listeners.slice().forEach(fn => fn({ target: { closest: () => ({}) } })); }
  }
  let count = 0;
  const screen = { shell: true, render: () => '', mount: node => window.UI.on(node, 'click', '[data-action]', () => count++) };
  const window = {
    addEventListener() {}, scrollTo() {},
    Store: { user: () => ({ onboarded: true, gender: 'male', name: 'Demo' }), effectiveTheme: () => 'light' },
    Admin: { isAdmin: () => true }, App: { syncThemeButtons() {} },
    Screens: { home: screen, adminDashboard: screen }
  };
  const document = { readyState: 'loading', addEventListener() {} };
  const context = vm.createContext({ window, document, console, location: { hash: file.includes('admin') ? '#/admin' : '#/home' } });
  vm.runInContext(read('js/ui.js'), context);
  Object.assign(window.UI, {
    $: selector => nodes[selector] || (nodes[selector] = new Element()),
    $$: () => [], el: () => new Element(), Sheet: { close() {} }, stickyTopbar() {}
  });
  vm.runInContext(read(file), context);
  return { window, nodes, screen, count: () => count };
}
for (const file of ['js/router.js', 'js/admin-shell.js']) {
  test(file + ': revisiting a screen runs each action once', () => {
    const fixture = routerFixture(file);
    fixture.window.Router.render();
    const original = fixture.nodes['[data-view]'];
    fixture.window.Router.render();
    fixture.window.Router.render();
    assert.notEqual(fixture.nodes['[data-view]'], original);
    fixture.nodes['[data-view]'].click();
    assert.equal(fixture.count(), 1);
  });
  test(file + ': shell-free screens mount inside a disposable child', () => {
    const fixture = routerFixture(file);
    fixture.screen.shell = false;
    fixture.window.Router.render();
    fixture.window.Router.render();
    fixture.nodes['#root'].firstElementChild.click();
    assert.equal(fixture.nodes['#root'].listeners.length, 0);
    assert.equal(fixture.count(), 1);
  });
}

test('all application JavaScript parses', () => {
  const files = ['build.js', 'sw.js', ...fs.readdirSync(path.join(ROOT, 'js'), { recursive: true })
    .filter(file => file.endsWith('.js')).map(file => 'js/' + file)];
  files.forEach(file => new vm.Script(read(file), { filename: file }));
});
