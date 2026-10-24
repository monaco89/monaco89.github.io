const ipod = document.querySelector('.ipod');
const title = ipod.querySelector('.screen-title');
const wheel = ipod.querySelector('.wheel');

const stack = [{ view: document.getElementById('menu'), index: 0 }];
const current = () => stack[stack.length - 1];
const items = () => [...current().view.querySelectorAll('li')];
const isMenu = (view) => view.classList.contains('menu');

function render() {
  const { view, index } = current();
  title.textContent = view.dataset.title;
  if (isMenu(view)) items().forEach((li, i) => li.classList.toggle('selected', i === index));
}

function move(step) {
  const frame = current();
  if (isMenu(frame.view)) {
    frame.index = Math.max(0, Math.min(items().length - 1, frame.index + step));
    render();
  } else {
    frame.view.scrollTop += step * frame.view.clientHeight / 4;
  }
}

function open(view) {
  current().view.classList.replace('active', 'behind');
  view.classList.add('active');
  view.scrollTop = 0;
  stack.push({ view, index: 0 });
  render();
}

function back() {
  if (stack.length < 2) return;
  stack.pop().view.classList.remove('active');
  current().view.classList.replace('behind', 'active');
  render();
}

function select() {
  const { view, index } = current();
  if (isMenu(view)) items()[index].querySelector('a').click();
}

const actions = { prev: () => move(-1), next: () => move(1), menu: back, play: select, select };

ipod.addEventListener('click', (e) => {
  const link = e.target.closest('.menu a');
  if (link?.getAttribute('href').startsWith('#')) {
    e.preventDefault();
    open(document.querySelector(link.getAttribute('href')));
    return;
  }
  const button = e.target.closest('[data-action]');
  if (button) actions[button.dataset.action]();
});

for (const type of ['mouseover', 'focusin']) {
  ipod.addEventListener(type, (e) => {
    const li = e.target.closest('.menu li');
    if (!li || !current().view.contains(li)) return;
    current().index = items().indexOf(li);
    render();
  });
}

const keys = {
  ArrowDown: () => move(1),
  ArrowUp: () => move(-1),
  ArrowRight: select,
  Enter: select,
  ArrowLeft: back,
  Escape: back,
  Backspace: back,
};

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  // Focused links and buttons already activate natively on Enter.
  if (e.key === 'Enter' && e.target.closest('a, button')) return;
  const action = keys[e.key];
  if (!action) return;
  e.preventDefault();
  action();
});

const STEP = Math.PI / 9;
let lastAngle = null;
let turned = 0;

function angleOf(e) {
  const r = wheel.getBoundingClientRect();
  return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
}

wheel.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.center')) return;
  wheel.setPointerCapture(e.pointerId);
  lastAngle = angleOf(e);
  turned = 0;
});

wheel.addEventListener('pointermove', (e) => {
  if (lastAngle === null) return;
  const angle = angleOf(e);
  let delta = angle - lastAngle;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  else if (delta <= -Math.PI) delta += 2 * Math.PI;
  lastAngle = angle;
  turned += delta;
  // Screen y grows downward, so clockwise rotation is a positive delta.
  while (turned >= STEP) { move(1); turned -= STEP; }
  while (turned <= -STEP) { move(-1); turned += STEP; }
});

const release = () => { lastAngle = null; };
wheel.addEventListener('pointerup', release);
wheel.addEventListener('pointercancel', release);

let scrolled = 0;
ipod.addEventListener('wheel', (e) => {
  e.preventDefault();
  scrolled += e.deltaY;
  while (Math.abs(scrolled) >= 40) {
    const step = Math.sign(scrolled);
    move(step);
    scrolled -= step * 40;
  }
}, { passive: false });
