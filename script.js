//***DATA - CALÊNDARIO

// Função para lidar com datas no fuso local
function getTodayLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
// Formata a data como 'YYYY-MM-DD'
function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

//***AUTENTICAÇÃO

// Elementos DOM
const authModal = document.getElementById('authModal');
const app = document.getElementById('app');
const loginBtn = document.getElementById('loginBtn');
const toggleAuth = document.getElementById('toggleAuth');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const welcome = document.getElementById('welcome');

// Estado de autenticação
let isRegister = false;
let currentUser = localStorage.getItem('currentUser');

// Mostrar modal de autenticação se não estiver logado
if (!currentUser) {
  authModal.classList.remove('hidden');
} else {
  startApp();
}

// Alternar entre login e cadastro
toggleAuth.addEventListener('click', () => {
  isRegister = !isRegister; // Alterna o estado
  authTitle.textContent = isRegister ? 'Criar conta' : 'Entrar'; // Atualiza o título
  authSubtitle.textContent = isRegister // Atualiza o subtítulo
    ? 'Crie sua conta para começar'
    : 'Acesse sua conta para continuar';
  loginBtn.textContent = isRegister ? 'Criar conta' : 'Entrar';
  toggleAuth.textContent = isRegister ? 'Já tenho conta' : 'Criar conta';
});

// Lidar com login/cadastro
loginBtn.addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) return alert('Preencha todos os campos');

  const key = `user: ${username}`;
  const saved = JSON.parse(localStorage.getItem(key));

  if (isRegister) {
    if (saved) return alert('Usuário já existe');
    localStorage.setItem(key, JSON.stringify({ password }));
  } else {
    if (!saved || saved.password !== password)
      return alert('Usuário inválido');
  }

  localStorage.setItem('currentUser', username);
  currentUser = username;
  authModal.classList.add('hidden');
  startApp();
});

document.querySelector('.logout')?.addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  location.reload();
});


//***APP

let habits = [];
const habitsContainer = document.getElementById('habitsContainer');
const emptyState = document.getElementById('emptyState');

// Iniciar o app após login
function startApp() {
  app.hidden = false;
  welcome.textContent = `Bem-vinda(o), ${currentUser} 👋`;
  loadHabits();
}

// Carregar hábitos do localStorage
function loadHabits() {
  habits = JSON.parse(localStorage.getItem(`habits:${currentUser}`)) || [];
  renderHabits();
}

// Salvar hábitos no localStorage
function saveHabits() {
  localStorage.setItem(`habits:${currentUser}`, JSON.stringify(habits));
}


//***CRIAR HÁBITO

// Criar novo hábito
document.getElementById('newHabitBtn')?.addEventListener('click', () => {
  const name = prompt('Nome do hábito');
  if (!name) return;

  // Adicionar novo hábito ao array
  habits.push({
    id: crypto.randomUUID(), // Gera um ID único aleatório
    name,
    days: {}
  });

  saveHabits();
  renderHabits();
});

//***RENDER

// Renderizar hábitos na tela
function renderHabits() {
  habitsContainer.innerHTML = '';

  if (habits.length === 0) {
    emptyState.classList.remove('hidden'); //
    return;
  }

  emptyState.classList.add('hidden');

  habits.forEach(h => habitsContainer.appendChild(createHabitCard(h)));
}

function createHabitCard(habit) {
  const card = document.createElement('article');
  card.className = 'habit-card';

  const monthName = new Date().toLocaleDateString('pt-BR', {
    month: 'long'
  });

  card.innerHTML = `
    <div class="habit-header">
      <h2>${habit.name}</h2>
      <span class="percentage">0%</span>
    </div>

    <div class="habit-month">${monthName}</div>

    <div class="streak">🔥 Streak: <span>0</span> dias</div>
    <div class="heatmap"></div>
  `;

  generateHeatmap(card, habit);
  updateStats(card, habit);

  return card;
}


function updateStats(card, habit) {
  const streakValue = calculateStreak(habit);
  card.querySelector('.streak span').textContent = streakValue;

  const { percent, done, total } = calculateConsistency(habit);
  card.querySelector('.percentage').textContent =
    `${percent}% • ${done} de ${total} dias`;
}

//***HEATMAP

// Gerar o heatmap de dias para o hábito
function generateHeatmap(card, habit) {
  const heatmap = card.querySelector('.heatmap');
  heatmap.innerHTML = '';

  const today = getTodayLocal();
  const todayKey = formatDateLocal(today);

  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Criar botões para cada dia do mês
  for (let day = 1; day <= daysInMonth; day++) {
  const date = new Date(year, month, day);
  date.setHours(0, 0, 0, 0);

  const key = formatDateLocal(date);

  const dayEl = document.createElement('button');
  dayEl.className = 'day';

  dayEl.dataset.date = date.toLocaleDateString('pt-BR');

  if (key === todayKey) {
    dayEl.classList.add('day--today');
  }

  if (habit.days[key]) {
    dayEl.classList.add('day--active');
  }

  if (date > today) {
    dayEl.disabled = true;
    dayEl.classList.add('day--future');
  }

  // Bloqueia toque em dias futuros
  dayEl.addEventListener('click', () => {
    if (date > today) return;

    habit.days[key] = !habit.days[key]; // Alterna o estado do dia
    saveHabits();
    renderHabits();
  });

  heatmap.appendChild(dayEl);
  }
}

//***STATS

// Calcular streak de dias consecutivos
function calculateStreak(habit) {
  let streak = 0;
  const today = getTodayLocal();

  for (let i = 0; i < 365; i++) { // Começa do hoje e volta até 1 ano
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = formatDateLocal(d);

    if (habit.days[key]) streak++; // Incrementa streak se o dia foi completado
    else break;
  }
  return streak;
}

function calculateConsistency(habit) {
  const today = getTodayLocal();
  const total = today.getDate();
  let done = 0;

  for (let day = 1; day <= total; day++) { // Conta dias completados no mês atual
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    const key = formatDateLocal(date);
    if (habit.days[key]) done++;
  }

  return {
    percent: Math.round((done / total) * 100), // Percentual de dias arredondado
    done,
    total
  };
}


//***DARK MODE

const themeToggle = document.querySelector('.theme-toggle');

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    themeToggle.textContent = '🌙';
  }
}

applyTheme(localStorage.getItem('theme') || 'light'); // Aplica tema salvo ou padrão

themeToggle.addEventListener('click', () => {
  const newTheme = document.body.classList.contains('dark')
    ? 'light'
    : 'dark';

  localStorage.setItem('theme', newTheme);
  applyTheme(newTheme);
});
