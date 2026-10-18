const $ = (s) => document.querySelector(s);
const categories = { mind: ['Развитие', '▤'], health: ['Здоровье', '♧'], care: ['Забота о себе', '☼'], work: ['Дела и цели', '◇'] };
const periods = { day: ['Мой день', 'Мои привычки', 'НА СЕГОДНЯ', 'ФОКУС ДНЯ'], week: ['Неделя', 'Привычки недели', 'НА НЕДЕЛЮ', 'ФОКУС НЕДЕЛИ'], month: ['Месяц', 'Привычки месяца', 'НА МЕСЯЦ', 'ФОКУС МЕСЯЦА'], year: ['Год', 'Привычки года', 'НА ГОД', 'ФОКУС ГОДА'] };
const defaults = [
  ['Читать 20 минут', 'Внимание для новых идей · 20 минут', 'mind', 'day', 'soil'],
  ['Дневник', 'Зафиксировать мысли и наблюдения · 5 минут', 'care', 'day', 'soil'],
  ['Практика арабского', 'Несколько новых слов или упражнение · 15 минут', 'mind', 'day', 'soil'],
  ['Тренировка', 'Движение для энергии и силы · 30 минут', 'health', 'day', 'green'],
  ['Спланировать следующую неделю', 'Выбрать три главных направления', 'work', 'week'],
  ['Устроить вечер с близкими', 'Время для тех, кто важен', 'care', 'week'],
  ['Три тренировки за неделю', 'Укреплять тело в комфортном ритме', 'health', 'week'],
  ['Прочитать одну книгу', 'Открыть для себя новые идеи', 'mind', 'month'],
  ['Подвести итоги месяца', 'Заметить прогресс и скорректировать путь', 'work', 'month'],
  ['Попробовать что-то новое', 'Оставить место для любопытства', 'care', 'month'],
  ['Освоить новый навык', 'Маленькая практика каждую неделю', 'mind', 'year'],
  ['Пройти ежегодный чекап', 'Выделить время для здоровья', 'health', 'year'],
  ['Отправиться в путешествие', 'Собрать новые впечатления', 'care', 'year']
].map(([name, detail, category, period, aspect], i) => ({ id: `seed-${i}`, name, detail, category, period, aspect }));
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
function animatePage() {
  const content = document.querySelector('.content');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  content.classList.remove('transition'); void content.offsetWidth; content.classList.add('transition');
}
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
function startOfWeek(date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d;
}
function daysInRange(start, end) {
  const days = []; const cursor = new Date(start);
  while (cursor <= end) { days.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); }
  return days;
}
function dailySummary(date) {
  const dailyHabits = data.habits.filter(h => h.period === 'day');
  const checks = data.checks[key(date, 'day')] || {};
  return { done: dailyHabits.filter(h => checks[h.id]).length, total: dailyHabits.length };
}
function aspectFor(habit) { return habit.aspect || (habit.category === 'health' ? 'green' : 'soil'); }
function toggleDailyHabit(id, date = selectedDate) {
  const checks = data.checks[key(date, 'day')] || (data.checks[key(date, 'day')] = {});
  const completed = !checks[id]; checks[id] = completed;
  if (completed && navigator.vibrate) navigator.vibrate(10);
  save(); render(); toast(completed ? 'Привычка отмечена' : 'Отметка снята');
}
function aggregate(days) {
  return days.reduce((summary, day) => { const item = dailySummary(day); summary.done += item.done; summary.total += item.total; return summary; }, { done: 0, total: 0 });
}
function trackedDays() {
  if (period === 'week') { const start = startOfWeek(selectedDate), end = new Date(start); end.setDate(end.getDate() + 6); return daysInRange(start, end); }
  if (period === 'month') { const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1), end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0); return daysInRange(start, end); }
  return [];
}
function plannerTitle() { return period === 'week' ? 'Ежедневный прогресс недели' : period === 'month' ? 'Календарь выполнения' : 'Прогресс по месяцам'; }
function dayCard(day, compact = false) {
  const stat = dailySummary(day), card = document.createElement('button');
  card.className = `planner-day${stat.done ? ' has-progress' : ''}${localDate(day) === localDate(new Date()) ? ' today' : ''}`;
  card.type = 'button'; card.setAttribute('aria-label', `${day.toLocaleDateString('ru-RU')}: ${stat.done} из ${stat.total}`);
  const name = document.createElement('span'); name.className = 'planner-day-name'; name.textContent = compact ? String(day.getDate()) : day.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
  const count = document.createElement('strong'); count.textContent = `${stat.done}/${stat.total}`;
  const bar = document.createElement('i'); bar.style.width = `${stat.total ? stat.done / stat.total * 100 : 0}%`;
  card.append(name, count, bar);
  card.onclick = () => { selectedDate = new Date(day); period = 'day'; filter = 'all'; document.querySelectorAll('[data-period]').forEach(b => b.classList.toggle('active', b.dataset.period === 'day')); document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('selected', b.dataset.filter === 'all')); render(); };
  return card;
}
function renderPlanner() {
  const planner = $('#period-planner'); planner.replaceChildren();
  if (period === 'day') { planner.hidden = true; return; }
  planner.hidden = false;
  const heading = document.createElement('div'); heading.className = 'planner-heading';
  const title = document.createElement('h3'); title.textContent = plannerTitle();
  const note = document.createElement('span'); note.textContent = 'Отметки ежедневных привычек'; heading.append(title, note); planner.append(heading);
  const grid = document.createElement('div');
  if (period === 'week') {
    grid.className = 'planner-grid week-planner'; trackedDays().forEach(day => grid.append(dayCard(day)));
  } else if (period === 'month') {
    grid.className = 'planner-grid month-planner';
    const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(name => { const label = document.createElement('span'); label.className = 'planner-weekday'; label.textContent = name; grid.append(label); });
    for (let i = 0; i < (first.getDay() + 6) % 7; i++) { const spacer = document.createElement('span'); spacer.className = 'planner-spacer'; grid.append(spacer); }
    trackedDays().forEach(day => grid.append(dayCard(day, true)));
  } else {
    grid.className = 'planner-grid year-planner';
    for (let month = 0; month < 12; month++) {
      const start = new Date(selectedDate.getFullYear(), month, 1), end = new Date(selectedDate.getFullYear(), month + 1, 0), stat = aggregate(daysInRange(start, end));
      const card = document.createElement('div'); card.className = 'planner-month';
      const name = document.createElement('span'); name.textContent = start.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');
      const count = document.createElement('strong'); count.textContent = `${stat.done}/${stat.total}`;
      const bar = document.createElement('i'); bar.style.width = `${stat.total ? stat.done / stat.total * 100 : 0}%`;
      card.append(name, count, bar); grid.append(card);
    }
  }
  planner.append(grid);
}
function renderDayComposition() {
  const composition = $('#day-composition');
  if (period !== 'day') { composition.hidden = true; return; }
  composition.hidden = false; composition.replaceChildren();
  const habits = data.habits.filter(h => h.period === 'day'), checks = data.checks[key(selectedDate, 'day')] || {};
  const heading = document.createElement('div'); heading.className = 'composition-heading';
  const copy = document.createElement('div'); const title = document.createElement('h2'); title.textContent = 'Структура дня'; const caption = document.createElement('p'); caption.textContent = 'Ум и тело — две опоры твоего дня'; copy.append(title, caption);
  const total = document.createElement('span'); total.className = 'composition-total'; total.textContent = `${habits.filter(h => checks[h.id]).length}/${habits.length} выполнено`; heading.append(copy, total); composition.append(heading);
  const map = document.createElement('div'); map.className = 'day-map';
  const aspects = [{ key: 'soil', name: 'Почва', subtitle: 'Фокус и знания' }, { key: 'green', name: 'Рост', subtitle: 'Тело и энергия' }];
  aspects.forEach(aspect => {
    const group = habits.filter(h => aspectFor(h) === aspect.key), panel = document.createElement('section'); panel.className = `aspect-panel aspect-${aspect.key}`;
    const label = document.createElement('div'); label.className = 'aspect-label'; const name = document.createElement('strong'); name.textContent = aspect.name; const sub = document.createElement('span'); sub.textContent = aspect.subtitle; label.append(name, sub); panel.append(label);
    const segments = document.createElement('div'); segments.className = 'aspect-segments';
    group.forEach(habit => { const segment = document.createElement('button'); segment.type = 'button'; segment.className = `aspect-segment${checks[habit.id] ? ' done' : ''}`; segment.setAttribute('aria-pressed', String(!!checks[habit.id])); segment.setAttribute('aria-label', `${checks[habit.id] ? 'Отменить выполнение' : 'Выполнить'}: ${habit.name}`); const check = document.createElement('i'); check.textContent = '✓'; const text = document.createElement('span'); text.textContent = habit.name; segment.append(check, text); segment.onclick = () => toggleDailyHabit(habit.id); segments.append(segment); });
    if (!group.length) { const empty = document.createElement('span'); empty.className = 'aspect-empty'; empty.textContent = 'Добавь привычку'; segments.append(empty); }
    panel.append(segments); map.append(panel);
  });
  composition.append(map);
}
function render() {
  const meta = periods[period], checks = data.checks[key()] || {}, habits = data.habits.filter(h => h.period === period);
  const specialDone = habits.filter(h => checks[h.id]).length, overview = period === 'day' ? { done: specialDone, total: habits.length } : period === 'year' ? aggregate(Array.from({ length: 12 }, (_, month) => new Date(selectedDate.getFullYear(), month, 1)).flatMap(start => daysInRange(start, new Date(start.getFullYear(), start.getMonth() + 1, 0)))) : aggregate(trackedDays());
  const done = overview.done, total = overview.total, percent = total ? Math.round(done / total * 100) : 0;
  $('#crumb').textContent = meta[0]; $('#habit-title').firstChild.textContent = `${meta[1]} `; $('#habit-badge').textContent = habits.length;
  $('#habit-period').textContent = meta[2]; $('#focus-label').textContent = meta[3]; $('#focus').value = data.focus[key()] || '';
  $('#focus').placeholder = { day:'Сегодня я хочу…',week:'На этой неделе я хочу…',month:'В этом месяце я хочу…',year:'В этом году я хочу…' }[period];
  $('.stats .stat-label').textContent = period === 'day' ? 'Выполнено привычек' : `Выполнено за ${period === 'week' ? 'неделю' : period === 'month' ? 'месяц' : 'год'}`;
  $('#date-label').textContent = dateLabel(); $('#completed-count').textContent = done; $('#total-count').textContent = ` / ${total}`;
  $('#progress-number').textContent = percent; $('#progress-bar').style.width = `${percent}%`; const n = streak(); $('#streak').textContent = n;
  $('#streak-unit').textContent = ` ${n % 10 === 1 && n % 100 !== 11 ? 'день' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'дня' : 'дней'}`;
  renderDayComposition(); renderPlanner();
  const list = $('#habits'); list.replaceChildren();
  const visible = habits.filter(h => filter === 'all' || (filter === 'done' ? checks[h.id] : !checks[h.id]));
  if (!visible.length) { const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = !habits.length ? 'Здесь вырастет что-то хорошее. Добавь первую привычку ♧' : filter === 'pending' ? 'Всё выполнено. Время выдохнуть ♧' : 'Пока нет выполненных привычек. Начни с маленького шага.'; list.append(empty); }
  visible.forEach(h => {
    const row = document.createElement('div'); row.className = `habit-row${checks[h.id] ? ' done' : ''}`;
    const check = document.createElement('button'); check.className = 'check'; check.textContent = '✓'; check.setAttribute('aria-label', `${checks[h.id] ? 'Отменить выполнение' : 'Выполнить'}: ${h.name}`); check.setAttribute('aria-pressed', String(!!checks[h.id]));
    check.onclick = () => { if (period === 'day') toggleDailyHabit(h.id); else { const completed = !checks[h.id]; data.checks[key()] ||= {}; data.checks[key()][h.id] = completed; save(); render(); toast(completed ? 'Привычка отмечена' : 'Отметка снята'); } };
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
document.querySelectorAll('[data-period]').forEach(button => button.onclick = () => { period = button.dataset.period; filter = 'all'; document.querySelectorAll('[data-period]').forEach(b => b.classList.toggle('active', b === button)); document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('selected', b.dataset.filter === 'all')); animatePage(); render(); });
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
