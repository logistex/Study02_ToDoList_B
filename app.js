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

// ===== 이벤트 =====

function init() {}

if (document.getElementById('app')) init();
