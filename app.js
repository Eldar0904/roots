const $ = (s) => document.querySelector(s);
const categories = { mind: ['Развитие', '▤'], health: ['Здоровье', '♧'], care: ['Забота о себе', '☼'], work: ['Дела и цели', '◇'] };
const periods = { day: ['Мой день', 'Мои привычки', 'НА СЕГОДНЯ', 'ФОКУС ДНЯ'], week: ['Неделя', 'Привычки недели', 'НА НЕДЕЛЮ', 'ФОКУС НЕДЕЛИ'], month: ['Месяц', 'Привычки месяца', 'НА МЕСЯЦ', 'ФОКУС МЕСЯЦА'], year: ['Год', 'Привычки года', 'НА ГОД', 'ФОКУС ГОДА'] };
const defaults = [
  ['Стакан воды после пробуждения', 'Начать день с заботы о теле · 2 минуты', 'health', 'day'],
  ['Читать 20 минут', 'Несколько страниц — новые мысли', 'mind', 'day'],
  ['Прогулка на свежем воздухе', 'Замедлиться и заметить мир вокруг · 30 минут', 'health', 'day'],
  ['Время без экрана перед сном', 'Подарить себе спокойный вечер · 1 час', 'care', 'day'],
  ['Записать три благодарности', 'Увидеть хорошее в простых вещах · 5 минут', 'care', 'day'],
  ['Спланировать следующую неделю', 'Выбрать три главных направления', 'work', 'week'],
  ['Устроить вечер с близкими', 'Время для тех, кто важен', 'care', 'week'],
  ['Три тренировки за неделю', 'Укреплять тело в комфортном ритме', 'health', 'week'],
  ['Прочитать одну книгу', 'Открыть для себя новые идеи', 'mind', 'month'],
  ['Подвести итоги месяца', 'Заметить прогресс и скорректировать путь', 'work', 'month'],
  ['Попробовать что-то новое', 'Оставить место для любопытства', 'care', 'month'],
  ['Освоить новый навык', 'Маленькая практика каждую неделю', 'mind', 'year'],
  ['Пройти ежегодный чекап', 'Выделить время для здоровья', 'health', 'year'],
  ['Отправиться в путешествие', 'Собрать новые впечатления', 'care', 'year']
].map(([name, detail, category, period], i) => ({ id: `seed-${i}`, name, detail, category, period }));
let data;
try { data = JSON.parse(localStorage.getItem('roots-v1')); } catch {}
if (!data || !Array.isArray(data.habits) || !data.checks || !data.focus) data = { habits: defaults, checks: {}, focus: {} };
let period = 'day', selectedDate = new Date(), filter = 'all', toastTimer;
const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function key(date = selectedDate, mode = period) {
  const d = new Date(date);
  if (mode === 'week') { d.setDate(d.getDate() - (d.getDay() + 6) % 7); return `week:${localDate(d)}`; }
  if (mode === 'month') return `month:${d.getFullYear()}-${d.getMonth() + 1}`;
  if (mode === 'year') return `year:${d.getFullYear()}`;
  return `day:${localDate(d)}`;
}
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2600); }
function save() { try { localStorage.setItem('roots-v1', JSON.stringify(data)); } catch { toast('Не удалось сохранить данные. Проверьте доступ к хранилищу браузера.'); } }
function dateLabel() {
  const d = selectedDate;
  if (period === 'year') return `${d.getFullYear()} год`;
  if (period === 'month') return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '');
  if (period === 'week') { const start = new Date(d); start.setDate(d.getDate() - (d.getDay() + 6) % 7); const end = new Date(start); end.setDate(start.getDate() + 6); return `${start.toLocaleDateString('ru-RU', {day:'numeric',month:'short'})} — ${end.toLocaleDateString('ru-RU', {day:'numeric',month:'short',year:'numeric'})}`; }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '');
}
function streak() {
  let count = 0; const d = new Date();
  if (!Object.values(data.checks[key(d, 'day')] || {}).some(Boolean)) d.setDate(d.getDate() - 1);
  while (Object.values(data.checks[key(d, 'day')] || {}).some(Boolean)) { count++; d.setDate(d.getDate() - 1); }
  return count;
}
function render() {
  const meta = periods[period], checks = data.checks[key()] || {}, habits = data.habits.filter(h => h.period === period);
  const done = habits.filter(h => checks[h.id]).length, percent = habits.length ? Math.round(done / habits.length * 100) : 0;
  $('#crumb').textContent = meta[0]; $('#habit-title').firstChild.textContent = `${meta[1]} `; $('#habit-badge').textContent = habits.length;
  $('#habit-period').textContent = meta[2]; $('#focus-label').textContent = meta[3]; $('#focus').value = data.focus[key()] || '';
  $('#focus').placeholder = { day:'Сегодня я хочу…',week:'На этой неделе я хочу…',month:'В этом месяце я хочу…',year:'В этом году я хочу…' }[period];
  $('#date-label').textContent = dateLabel(); $('#completed-count').textContent = done; $('#total-count').textContent = ` / ${habits.length}`;
  $('#progress-number').textContent = percent; $('#progress-bar').style.width = `${percent}%`; const n = streak(); $('#streak').textContent = n;
  $('#streak-unit').textContent = ` ${n % 10 === 1 && n % 100 !== 11 ? 'день' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'дня' : 'дней'}`;
  const list = $('#habits'); list.replaceChildren();
  const visible = habits.filter(h => filter === 'all' || (filter === 'done' ? checks[h.id] : !checks[h.id]));
  if (!visible.length) { const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = !habits.length ? 'Здесь вырастет что-то хорошее. Добавь первую привычку ♧' : filter === 'pending' ? 'Всё выполнено. Время выдохнуть ♧' : 'Пока нет выполненных привычек. Начни с маленького шага.'; list.append(empty); }
  visible.forEach(h => {
    const row = document.createElement('div'); row.className = `habit-row${checks[h.id] ? ' done' : ''}`;
    const check = document.createElement('button'); check.className = 'check'; check.textContent = '✓'; check.setAttribute('aria-label', `${checks[h.id] ? 'Отменить выполнение' : 'Выполнить'}: ${h.name}`); check.setAttribute('aria-pressed', String(!!checks[h.id]));
    check.onclick = () => { data.checks[key()] ||= {}; data.checks[key()][h.id] = !checks[h.id]; save(); render(); };
    const category = categories[h.category] || categories.mind;
    const icon = document.createElement('span'); icon.className = `habit-icon ${h.category}`; icon.textContent = category[1]; icon.setAttribute('aria-hidden', 'true');
    const info = document.createElement('div'); info.className = 'habit-info';
    const name = document.createElement('div'); name.className = 'habit-name'; name.textContent = h.name;
    const detail = document.createElement('div'); detail.className = 'habit-detail'; detail.textContent = h.detail; info.append(name, detail);
    const tag = document.createElement('span'); tag.className = `category ${h.category}`; tag.textContent = category[0];
    const remove = document.createElement('button'); remove.className = 'delete'; remove.textContent = '×'; remove.setAttribute('aria-label', `Удалить привычку: ${h.name}`);
    remove.onclick = () => { if (!confirm(`Удалить привычку «${h.name}» из всех периодов?`)) return; data.habits = data.habits.filter(item => item.id !== h.id); Object.values(data.checks).forEach(c => delete c[h.id]); save(); render(); toast('Привычка удалена'); };
    row.append(check, icon, info, tag, remove); list.append(row);
  });
}
document.querySelectorAll('[data-period]').forEach(button => button.onclick = () => { period = button.dataset.period; filter = 'all'; document.querySelectorAll('[data-period]').forEach(b => b.classList.toggle('active', b === button)); document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('selected', b.dataset.filter === 'all')); render(); });
document.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => { filter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('selected', b === button)); render(); });
function move(direction) { const d = new Date(selectedDate); if (period === 'day' || period === 'week') d.setDate(d.getDate() + direction * (period === 'week' ? 7 : 1)); if (period === 'month') { d.setDate(1); d.setMonth(d.getMonth() + direction); } if (period === 'year') { d.setDate(1); d.setFullYear(d.getFullYear() + direction); } selectedDate = d; render(); }
$('#previous').onclick = () => move(-1); $('#next').onclick = () => move(1);
$('#focus').addEventListener('input', e => { data.focus[key()] = e.target.value; save(); });
const dialog = $('#habit-dialog');
$('#add-habit').onclick = () => { $('#habit-form').reset(); dialog.showModal(); $('#habit-name').focus(); };
$('#close-dialog').onclick = $('#cancel-dialog').onclick = () => dialog.close();
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
$('#habit-form').onsubmit = e => { e.preventDefault(); const name = $('#habit-name').value.trim(); if (!name) { $('#habit-name').setCustomValidity('Введите название привычки'); $('#habit-name').reportValidity(); return; } data.habits.push({ id: crypto.randomUUID(), name, detail: $('#habit-detail').value.trim(), category: $('#habit-category').value, period }); filter = 'all'; document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('selected', b.dataset.filter === 'all')); save(); dialog.close(); render(); toast('Новая привычка пустила корни ♧'); };
$('#habit-name').addEventListener('input', () => $('#habit-name').setCustomValidity(''));
render();
