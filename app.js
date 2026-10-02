// ===== 상수 =====

const CATEGORIES = {
  work: { name: '업무', color: '#3B82F6' },
  personal: { name: '개인', color: '#10B981' },
  study: { name: '공부', color: '#F59E0B' },
};

const STORAGE_KEY = 'todos.v1';
const FILTER_KEY = 'todos.filter';

// ===== 이벤트 =====

function init() {}

if (document.getElementById('app')) init();
