import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const toolkit = html.slice(html.indexOf('<div class="toolkit-grid">'), html.indexOf('<section class="contact-section"'));

test('all toolkit proficiency colours match the supplied ratings, including Qt and Qt Creator', () => {
  const expected = {
    d: ['C++', 'Python', 'TensorFlow', 'OpenCV', 'Qt', 'NumPy', 'Jupyter', 'ilastik', 'AWS', 'Qt Creator', 'Codex'],
    s: ['Kotlin', 'TypeScript', 'Java', 'JavaScript', 'SQL', 'scikit-learn', 'ONNX Runtime', 'Android', 'Node.js', 'pandas', 'Docker', 'PostgreSQL', 'Git', 'Android Studio', 'Cursor'],
    y: ['PyTorch', 'Jetpack Compose', 'React', 'Three.js', 'Matplotlib', 'CellProfiler', 'Google Cloud', 'Linux', 'Apache Spark', 'CMake'],
    r: ['CUDA', 'Fiji / ImageJ', 'Claude'],
  };
  const entries = [...toolkit.matchAll(/<li data-proficiency="([dsyr])">[\s\S]*?<\/li>/g)];
  assert.equal(entries.length, 39);
  assert.equal((toolkit.match(/<li\b/g) || []).length, entries.length, 'Every toolkit entry must have a rating');
  for (const [rating, names] of Object.entries(expected)) {
    const actual = entries.filter(match => match[1] === rating).map(match => match[0].match(/>([^<>]+)<\/li>$/)[1]);
    assert.deepEqual(actual.sort(), [...names].sort());
  }
});

test('the standard green and original hover timing remain unchanged', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  const resting = css.match(/\.toolkit-tools > li \{([^}]+)\}/)[1];
  assert.match(resting, /--toolkit-hover-background: rgba\(200, 255, 55, 0\.22\)/);
  assert.match(resting, /transition: border-color 180ms ease, background-color 180ms ease/);
  assert.match(css, /\.toolkit-tools > li:hover \{[^}]+background: var\(--toolkit-hover-background\)/);
});
