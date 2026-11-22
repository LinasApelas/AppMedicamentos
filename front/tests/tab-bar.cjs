const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function render(platform, index, prevent = false) {
  const navigated = [], events = [];
  const jsx = (type, props) => ({ type, props });
  const imports = {
    react: { useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}], useEffect: () => {} },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Platform: { OS: platform }, View: 'View', Text: 'Text', Pressable: 'Pressable',
      StyleSheet: { create: s => s }, Animated: { View: 'AnimatedView', Value: class { constructor(v) { this.value = v; } } } },
    '@expo/vector-icons/MaterialIcons': { __esModule: true, default: 'MaterialIcon' },
    'expo-font': { useFonts: () => [true, null] },
    'expo-haptics': { selectionAsync: async () => {} }, './Motion': { useReducedMotion: () => false },
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/components/TabBar.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require: n => imports[n] });
  const routes = ['Lembretes', 'Adicionar', 'Farmacias'].map(name => ({ name, key: name }));
  const root = exports.default({ state: { routes, index }, insets: { bottom: 0, left: 0, right: 0 },
    descriptors: Object.fromEntries(routes.map(r => [r.key, { options: {} }])),
    emitter: { emit: e => { events.push(e); return { defaultPrevented: prevent }; } },
    navigateToTab: key => navigated.push(key) });
  const nodes = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (typeof node.type === 'function') { visit(node.type(node.props)); return; }
    nodes.push(node); visit(node.props?.children);
  }
  visit(root);
  return { nodes, navigated, events };
}

test('abas Android/iOS: mesmo desenho/tamanho/posição ativo e inativo', () => {
  for (const platform of ['android', 'ios']) {
    for (let index = 0; index < 3; index++) {
      const { nodes } = render(platform, index);
      const icons = nodes.filter(n => n.type === 'MaterialIcon');
      assert.deepEqual(icons.map(n => n.props.name), ['notifications-none', 'add', 'location-on']);
      icons.forEach((icon, i) => {
        assert.equal(icon.props.size, 28);
        assert.equal(icon.props.color, i === index ? '#12323A' : '#808080');
      });
      for (const n of nodes) {
        const styles = Array.isArray(n.props.style) ? n.props.style : [n.props.style];
        assert.ok(styles.every(s => !s?.transform), 'Não deslocar nem redimensionar ícone/rótulo ao selecionar');
      }
      const buttons = nodes.filter(n => n.type === 'Pressable');
      assert.equal(buttons.length, 3);
      buttons.forEach((button, i) => assert.equal(button.props.accessibilityState.selected, i === index));
    }
  }
});

test('abas preservam navegação, tabPress cancelável e toque longo', () => {
  const view = render('android', 0);
  const tabs = view.nodes.filter(n => n.type === 'Pressable');
  tabs[0].props.onPress(); assert.equal(view.navigated.length, 0);
  tabs[2].props.onPress(); assert.deepEqual(view.navigated, ['Farmacias']);
  tabs[2].props.onLongPress(); assert.equal(view.events.at(-1).type, 'tabLongPress');
  const blocked = render('ios', 0, true);
  blocked.nodes.filter(n => n.type === 'Pressable')[2].props.onPress();
  assert.equal(blocked.navigated.length, 0);
});
