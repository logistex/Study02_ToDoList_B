// ===== 상수 =====

const CATEGORIES = {
  work: { name: '업무', color: '#3B82F6' },
  personal: { name: '개인', color: '#10B981' },
  study: { name: '공부', color: '#F59E0B' },
};

const STORAGE_KEY = 'todos.v1';
const FILTER_KEY = 'todos.filter';

const MAX_TITLE_LENGTH = 100;
const FILTERS = ['all'].concat(Object.keys(CATEGORIES));

// ===== 저장소 =====

let storageAvailable = true;

function readStorage(key) {
  try {
    const value = localStorage.getItem(key);
    storageAvailable = true;
    return value;
  } catch (e) {
    storageAvailable = false;
    console.warn('localStorage를 읽을 수 없습니다.', e);
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    storageAvailable = true;
  } catch (e) {
    storageAvailable = false;
    console.warn('localStorage에 저장할 수 없습니다.', e);
  }
}

function isStorageAvailable() {
  return storageAvailable;
}

function isValidTodo(todo) {
  return Boolean(todo) &&
    typeof todo.id === 'string' &&
    typeof todo.title === 'string' &&
    todo.title.trim().length > 0 &&
    todo.title.trim().length <= MAX_TITLE_LENGTH &&
    Boolean(CATEGORIES[todo.category]) &&
    typeof todo.completed === 'boolean' &&
    typeof todo.createdAt === 'string';
}

function loadTodos() {
  const raw = readStorage(STORAGE_KEY);
  if (raw === null) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn('저장된 할 일 데이터가 손상되어 빈 목록으로 시작합니다.', e);
    return [];
  }
  return Array.isArray(parsed) ? parsed.filter(isValidTodo) : [];
}

function saveTodos(todos) {
  writeStorage(STORAGE_KEY, JSON.stringify(todos));
}

function loadFilter() {
  const value = readStorage(FILTER_KEY);
  return FILTERS.includes(value) ? value : 'all';
}

function saveFilter(filter) {
  writeStorage(FILTER_KEY, filter);
}

// ===== 상태 변경 =====

function createId() {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 6).padEnd(4, '0');
}

function addTodo(todos, title, category) {
  const trimmed = title.trim();
  if (!trimmed || trimmed.length > MAX_TITLE_LENGTH) return todos;
  if (!CATEGORIES[category]) return todos;
  return todos.concat({
    id: createId(),
    title: trimmed,
    category,
    completed: false,
    createdAt: new Date().toISOString(),
  });
}

function updateTodo(todos, id, changes) {
  if (!todos.some((todo) => todo.id === id)) return todos;
  return todos.map((todo) => {
    if (todo.id !== id) return todo;
    const updated = Object.assign({}, todo);
    if (typeof changes.title === 'string') {
      const trimmed = changes.title.trim();
      if (trimmed && trimmed.length <= MAX_TITLE_LENGTH) updated.title = trimmed;
    }
    if (CATEGORIES[changes.category]) updated.category = changes.category;
    return updated;
  });
}

function toggleTodo(todos, id) {
  return todos.map((todo) => (todo.id === id ? Object.assign({}, todo, { completed: !todo.completed }) : todo));
}

function deleteTodo(todos, id) {
  return todos.filter((todo) => todo.id !== id);
}

function clearCompleted(todos) {
  return todos.filter((todo) => !todo.completed);
}

// ===== 계산 =====

function summarize(todos) {
  const done = todos.filter((todo) => todo.completed).length;
  const total = todos.length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

function getProgress(todos) {
  const byCategory = {};
  Object.keys(CATEGORIES).forEach((key) => {
    byCategory[key] = summarize(todos.filter((todo) => todo.category === key));
  });
  return { overall: summarize(todos), byCategory };
}

function getVisibleTodos(todos, filter) {
  const filtered = filter === 'all' ? todos.slice() : todos.filter((todo) => todo.category === filter);
  return filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  });
}

// ===== 화면 =====

const state = {
  todos: [],
  filter: 'all',
  lastCategory: 'work',
  editingId: null,
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderProgress(progress) {
  const overall = progress.overall;
  document.getElementById('progress-text').textContent = overall.total === 0
    ? '할 일을 추가해 보세요'
    : overall.done + ' / ' + overall.total + ' 완료 (' + overall.percent + '%)';
  document.getElementById('progress-bar').style.width = overall.percent + '%';

  const list = document.getElementById('category-progress');
  list.replaceChildren();
  Object.keys(CATEGORIES).forEach((key) => {
    const item = progress.byCategory[key];
    const li = el('li', 'category-progress-item ' + key);
    li.appendChild(el('span', 'category-progress-name', CATEGORIES[key].name));
    const bar = el('div', 'bar bar-small');
    bar.setAttribute('aria-hidden', 'true');
    const fill = el('div', 'bar-fill');
    fill.style.width = item.percent + '%';
    bar.appendChild(fill);
    li.appendChild(bar);
    li.appendChild(el('span', 'category-progress-count', item.done + '/' + item.total));
    list.appendChild(li);
  });
}

function renderCategoryOptions(select, selected) {
  Object.keys(CATEGORIES).forEach((key) => {
    const option = el('option', '', CATEGORIES[key].name);
    option.value = key;
    option.selected = key === selected;
    select.appendChild(option);
  });
}

function renderTodoItem(todo) {
  const li = el('li', 'todo-item ' + todo.category + (todo.completed ? ' completed' : ''));
  li.dataset.id = todo.id;

  if (state.editingId === todo.id) {
    li.classList.add('editing');
    const input = el('input', 'edit-title');
    input.type = 'text';
    input.maxLength = MAX_TITLE_LENGTH;
    input.value = todo.title;
    input.setAttribute('aria-label', '‘' + todo.title + '’ 제목 수정');
    const select = el('select', 'category-select edit-category');
    select.setAttribute('aria-label', '‘' + todo.title + '’ 카테고리 수정');
    renderCategoryOptions(select, todo.category);
    li.appendChild(input);
    li.appendChild(select);
    return li;
  }

  const checkbox = el('input', 'toggle');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.setAttribute('aria-label', '‘' + todo.title + '’ 완료 표시');
  li.appendChild(checkbox);
  li.appendChild(el('span', 'badge ' + todo.category, CATEGORIES[todo.category].name));
  li.appendChild(el('span', 'todo-title', todo.title));

  const editBtn = el('button', 'icon-btn edit-btn', '✎');
  editBtn.type = 'button';
  editBtn.setAttribute('aria-label', '‘' + todo.title + '’ 수정');
  li.appendChild(editBtn);

  const deleteBtn = el('button', 'icon-btn delete-btn', '🗑');
  deleteBtn.type = 'button';
  deleteBtn.setAttribute('aria-label', '‘' + todo.title + '’ 삭제');
  li.appendChild(deleteBtn);
  return li;
}

const FOCUSABLE_ROLES = ['toggle', 'edit-btn', 'delete-btn'];

// 다시 그리기 전에 목록 안에서 포커스가 있던 컨트롤을 기억한다.
function captureListFocus() {
  const active = document.activeElement;
  const li = active && active.closest ? active.closest('#todo-list .todo-item') : null;
  if (!li) return null;
  return {
    id: li.dataset.id,
    // 수정 입력창에서 저장·취소한 경우 그 항목의 수정 버튼으로 돌아간다.
    role: FOCUSABLE_ROLES.find((role) => active.classList.contains(role)) || 'edit-btn',
    index: Array.prototype.indexOf.call(li.parentNode.children, li),
  };
}

// 같은 항목의 같은 컨트롤로, 항목이 사라졌으면 그 자리의 다음 항목으로, 그마저 없으면 입력창으로 포커스를 돌린다.
function restoreListFocus(saved) {
  if (!saved) return;
  const items = Array.from(document.getElementById('todo-list').children);
  const target = items.find((li) => li.dataset.id === saved.id) || items[saved.index] || items[items.length - 1];
  const control = target ? target.querySelector('.' + saved.role) : null;
  (control || document.getElementById('new-title')).focus();
}

function render() {
  const savedFocus = captureListFocus();

  document.getElementById('storage-warning').hidden = isStorageAvailable();

  renderProgress(getProgress(state.todos));

  document.querySelectorAll('#filters .filter').forEach((button) => {
    button.setAttribute('aria-selected', String(button.dataset.filter === state.filter));
  });

  const visible = getVisibleTodos(state.todos, state.filter);
  const list = document.getElementById('todo-list');
  list.replaceChildren();
  visible.forEach((todo) => list.appendChild(renderTodoItem(todo)));

  const empty = document.getElementById('empty-message');
  empty.hidden = visible.length > 0;
  empty.textContent = state.todos.length === 0 ? '할 일이 없습니다' : '이 카테고리에 할 일이 없습니다';

  document.getElementById('clear-completed').disabled = !state.todos.some((todo) => todo.completed);

  const editInput = list.querySelector('.edit-title');
  if (editInput) {
    if (document.activeElement !== editInput) {
      editInput.focus();
      editInput.select();
    }
  } else {
    restoreListFocus(savedFocus);
  }
}

// ===== 이벤트 =====

function commitTodos(nextTodos) {
  if (nextTodos === state.todos) return;
  state.todos = nextTodos;
  saveTodos(state.todos);
  render();
}

function startEdit(id) {
  state.editingId = id;
  render();
}

function finishEdit(li, save) {
  const id = li.dataset.id;
  if (state.editingId !== id) return;
  state.editingId = null;
  if (save) {
    const nextTodos = updateTodo(state.todos, id, {
      title: li.querySelector('.edit-title').value,
      category: li.querySelector('.edit-category').value,
    });
    if (nextTodos !== state.todos) {
      state.todos = nextTodos;
      saveTodos(state.todos);
    }
  }
  render();
}

function init() {
  state.todos = loadTodos();
  state.filter = loadFilter();

  const form = document.getElementById('add-form');
  const titleInput = document.getElementById('new-title');
  const categorySelect = document.getElementById('new-category');
  const list = document.getElementById('todo-list');

  categorySelect.value = state.lastCategory;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const nextTodos = addTodo(state.todos, titleInput.value, categorySelect.value);
    if (nextTodos !== state.todos) {
      titleInput.value = '';
      commitTodos(nextTodos);
    }
    titleInput.focus();
  });

  categorySelect.addEventListener('change', () => {
    state.lastCategory = categorySelect.value;
  });

  document.getElementById('filters').addEventListener('click', (event) => {
    const button = event.target.closest('.filter');
    if (!button) return;
    state.filter = button.dataset.filter;
    saveFilter(state.filter);
    render();
  });

  list.addEventListener('change', (event) => {
    if (!event.target.classList.contains('toggle')) return;
    commitTodos(toggleTodo(state.todos, event.target.closest('.todo-item').dataset.id));
  });

  list.addEventListener('click', (event) => {
    const li = event.target.closest('.todo-item');
    if (!li) return;
    if (event.target.closest('.edit-btn')) {
      startEdit(li.dataset.id);
    } else if (event.target.closest('.delete-btn')) {
      if (confirm('이 할 일을 삭제할까요?')) commitTodos(deleteTodo(state.todos, li.dataset.id));
    }
  });

  list.addEventListener('dblclick', (event) => {
    if (!event.target.classList.contains('todo-title')) return;
    startEdit(event.target.closest('.todo-item').dataset.id);
  });

  list.addEventListener('keydown', (event) => {
    const li = event.target.closest('.todo-item.editing');
    if (!li) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      finishEdit(li, true);
    } else if (event.key === 'Escape') {
      finishEdit(li, false);
    }
  });

  list.addEventListener('focusout', (event) => {
    const li = event.target.closest('.todo-item.editing');
    if (!li || li.contains(event.relatedTarget)) return;
    finishEdit(li, true);
  });

  document.getElementById('clear-completed').addEventListener('click', () => {
    if (confirm('완료한 할 일을 모두 지울까요?')) commitTodos(clearCompleted(state.todos));
  });

  render();
}

if (document.getElementById('app')) init();
