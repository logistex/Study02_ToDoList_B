// ===== 상수 =====

const CATEGORIES = {
  work: { name: '업무', color: '#3B82F6' },
  personal: { name: '개인', color: '#10B981' },
  study: { name: '공부', color: '#F59E0B' },
};

const STORAGE_KEY = 'todos.v1';
const FILTER_KEY = 'todos.filter';

const MAX_TITLE_LENGTH = 100;

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
