const state = {
  data: null,
  selectedCode: 'CTRL',
  codeFilter: '',
  questionFilter: '',
};

const els = {
  heroCodeCount: document.getElementById('heroCodeCount'),
  heroQuestionCount: document.getElementById('heroQuestionCount'),
  heroSpecialCount: document.getElementById('heroSpecialCount'),
  heroDimensionCount: document.getElementById('heroDimensionCount'),
  metaGeneratedAt: document.getElementById('metaGeneratedAt'),
  randomHeroBtn: document.getElementById('randomHeroBtn'),
  codeSearch: document.getElementById('codeSearch'),
  codeResultCount: document.getElementById('codeResultCount'),
  codeList: document.getElementById('codeList'),
  personaStage: document.getElementById('personaStage'),
  personaBadge: document.getElementById('personaBadge'),
  personaTitle: document.getElementById('personaTitle'),
  personaIntro: document.getElementById('personaIntro'),
  personaDesc: document.getElementById('personaDesc'),
  personaNotes: document.getElementById('personaNotes'),
  levelPatternText: document.getElementById('levelPatternText'),
  levelStrip: document.getElementById('levelStrip'),
  specialHint: document.getElementById('specialHint'),
  specialList: document.getElementById('specialList'),
  verificationHeadline: document.getElementById('verificationHeadline'),
  verificationList: document.getElementById('verificationList'),
  answerCountText: document.getElementById('answerCountText'),
  answerGroups: document.getElementById('answerGroups'),
  jsonPreview: document.getElementById('jsonPreview'),
  questionSearch: document.getElementById('questionSearch'),
  questionBankList: document.getElementById('questionBankList'),
  copyChecklistBtn: document.getElementById('copyChecklistBtn'),
  copyCompactBtn: document.getElementById('copyCompactBtn'),
  downloadJsonBtn: document.getElementById('downloadJsonBtn'),
  copyJsonBtn: document.getElementById('copyJsonBtn'),
  toast: document.getElementById('toast'),
};

init();

async function init() {
  state.data = await loadData();
  hydrateHero();
  bindEvents();
  const initialCode = resolveRequestedCode(location.hash.slice(1)) || 'CTRL';
  selectCode(initialCode, { replaceHash: true });
}

async function loadData() {
  if (window.SBTI_SITE_DATA) return window.SBTI_SITE_DATA;
  const response = await fetch('./data/site-data.json');
  if (!response.ok) throw new Error('无法加载 site data');
  return response.json();
}

function hydrateHero() {
  els.heroCodeCount.textContent = state.data.codes.length;
  els.heroQuestionCount.textContent = state.data.questionBank.length;
  els.heroSpecialCount.textContent = state.data.specialQuestions.length;
  els.heroDimensionCount.textContent = state.data.dimensions.length;
  els.metaGeneratedAt.textContent = formatDate(state.data.generatedAt);
}

function bindEvents() {
  els.randomHeroBtn.addEventListener('click', () => {
    const pool = state.data.codes.map((item) => item.code);
    const next = pool[Math.floor(Math.random() * pool.length)];
    selectCode(next);
    document.getElementById('explorer').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  els.codeSearch.addEventListener('input', (event) => {
    state.codeFilter = event.target.value.trim().toLowerCase();
    renderCodeList();
  });

  els.questionSearch.addEventListener('input', (event) => {
    state.questionFilter = event.target.value.trim().toLowerCase();
    renderQuestionBank();
  });

  els.copyChecklistBtn.addEventListener('click', () => copyText(buildChecklistText(getCurrentSolution()), '答题清单已复制'));
  els.copyCompactBtn.addEventListener('click', () => copyText(buildCompactMap(getCurrentSolution()), 'value 映射已复制'));
  els.copyJsonBtn.addEventListener('click', () => copyText(JSON.stringify(getCurrentSolution(), null, 2), 'JSON 已复制'));
  els.downloadJsonBtn.addEventListener('click', downloadCurrentJson);

  window.addEventListener('hashchange', () => {
    const fromHash = resolveRequestedCode(location.hash.slice(1));
    if (fromHash && fromHash !== state.selectedCode) selectCode(fromHash, { pushHash: false });
  });
}

function resolveRequestedCode(raw) {
  if (!raw) return null;
  const hit = state.data.codes.find((item) => item.code.toLowerCase() === raw.toLowerCase());
  return hit ? hit.code : null;
}

function selectCode(code, options = {}) {
  state.selectedCode = code;
  if (options.replaceHash) {
    history.replaceState(null, '', `#${code}`);
  } else if (options.pushHash !== false) {
    history.replaceState(null, '', `#${code}`);
  }
  renderCodeList();
  renderSelected();
  renderQuestionBank();
}

function renderCodeList() {
  const current = state.codeFilter;
  const filtered = state.data.codes.filter((item) => {
    const haystack = `${item.code} ${item.cn || ''} ${item.pattern}`.toLowerCase();
    return !current || haystack.includes(current);
  });

  els.codeResultCount.textContent = filtered.length;
  els.codeList.innerHTML = filtered
    .map(
      (item) => `
        <button class="code-chip ${item.code === state.selectedCode ? 'is-active' : ''}" data-code="${item.code}" type="button">
          <strong>${item.code}</strong>
          <small>${item.cn || '未命名'} · ${item.pattern}</small>
        </button>
      `,
    )
    .join('');

  els.codeList.querySelectorAll('[data-code]').forEach((button) => {
    button.addEventListener('click', () => selectCode(button.dataset.code));
  });
}

function renderSelected() {
  const solution = getCurrentSolution();
  const codeMeta = state.data.codes.find((item) => item.code === state.selectedCode);
  const profile = solution.requestedProfile || {};
  const stage = els.personaStage;
  stage.classList.remove('is-refreshing');
  void stage.offsetWidth;
  stage.classList.add('is-refreshing');

  els.personaBadge.textContent = profile.cn ? `${solution.requestedCode} / ${profile.cn}` : solution.requestedCode;
  els.personaTitle.textContent = profile.cn ? `${solution.requestedCode}（${profile.cn}）` : solution.requestedCode;
  els.personaIntro.textContent = profile.intro || '当前人格没有 intro 文案。';
  els.personaDesc.textContent = profile.desc || '当前人格没有 desc 文案。';

  els.personaNotes.innerHTML = solution.notes.length
    ? solution.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')
    : `<li>pattern：${escapeHtml(codeMeta?.pattern || 'special')}</li>`;

  renderLevelStrip(solution);
  renderSpecialList(solution);
  renderVerification(solution);
  renderAnswerGroups(solution);
  els.jsonPreview.value = JSON.stringify(solution, null, 2);
}

function renderLevelStrip(solution) {
  if (!solution.levels) {
    els.levelPatternText.textContent = '特殊覆盖';
    els.levelStrip.innerHTML = `
      <div class="level-pill">
        <strong>普通题</strong>
        <b>MIX</b>
      </div>
      <div class="level-pill">
        <strong>最终判定</strong>
        <b>${solution.requestedCode}</b>
      </div>
    `;
    return;
  }

  const pattern = state.data.dimensions.map((dim) => solution.levels[dim.id]).join('');
  els.levelPatternText.textContent = pattern;
  els.levelStrip.innerHTML = state.data.dimensions
    .map((dim) => {
      const level = solution.levels[dim.id];
      const desc = dim.descriptions[level];
      return `
        <div class="level-pill">
          <div>
            <strong>${dim.name}</strong>
            <div class="mini-note">${escapeHtml(desc)}</div>
          </div>
          <b>${level}</b>
        </div>
      `;
    })
    .join('');
}

function renderSpecialList(solution) {
  const special = solution.specialAnswers;
  const isDrunk = solution.requestedCode === 'DRUNK';
  els.specialHint.textContent = isDrunk ? '命中隐藏人格' : '默认关闭覆盖';
  els.specialList.innerHTML = special
    .map(
      (item) => `
        <div class="special-item">
          <strong>${item.id}</strong>
          <p>${escapeHtml(item.question)}</p>
          <div class="question-choice">value ${item.chooseValue} · ${escapeHtml(item.chooseLabel)}</div>
        </div>
      `,
    )
    .join('');
}

function renderVerification(solution) {
  const verification = solution.verification;
  els.verificationHeadline.textContent = `${verification.finalCode} / ${verification.finalCn || '未命名'}`;
  els.verificationList.innerHTML = [
    {
      title: '最佳正常人格',
      body: `${verification.bestNormal.code} · similarity ${verification.bestNormal.similarity}% · distance ${verification.bestNormal.distance}`,
    },
    ...verification.top3.map((item, index) => ({
      title: `Top ${index + 1}`,
      body: `${item.code} · ${item.cn || '未命名'} · exact ${item.exact}/15 · ${item.similarity}%`,
    })),
  ]
    .map(
      (item) => `
        <div class="verification-item">
          <strong>${item.title}</strong>
          <p>${escapeHtml(item.body)}</p>
        </div>
      `,
    )
    .join('');
}

function renderAnswerGroups(solution) {
  const grouped = new Map(state.data.dimensions.map((dim) => [dim.id, []]));
  solution.answers.forEach((answer) => grouped.get(answer.dim)?.push(answer));
  const totalCount = solution.answers.length + solution.specialAnswers.length;
  els.answerCountText.textContent = `${totalCount} 条答案`;

  els.answerGroups.innerHTML = state.data.dimensions
    .map((dim) => {
      const list = grouped.get(dim.id) || [];
      if (!list.length) return '';
      const level = solution.levels?.[dim.id] || '—';
      return `
        <section class="answer-group">
          <div class="answer-group-head">
            <div>
              <h4>${dim.name}</h4>
              <p>${escapeHtml(dim.model)} · 等级 ${level}${dim.descriptions[level] ? ` · ${escapeHtml(dim.descriptions[level])}` : ''}</p>
            </div>
            <strong>${list.length} 题</strong>
          </div>
          <div class="answer-list">
            ${list
              .map(
                (item) => `
                  <article class="answer-item">
                    <div class="answer-top">
                      <strong>${item.id}</strong>
                      <span class="answer-choice">选 ${item.chooseValue} · ${escapeHtml(item.chooseLabel)}</span>
                    </div>
                    <p>${escapeHtml(item.question)}</p>
                  </article>
                `,
              )
              .join('')}
          </div>
        </section>
      `;
    })
    .join('');
}

function renderQuestionBank() {
  const solution = getCurrentSolution();
  const answerMap = Object.fromEntries(solution.answers.map((item) => [item.id, item.chooseValue]));
  const keyword = state.questionFilter;

  const items = state.data.questionBank.filter((question) => {
    const haystack = `${question.id} ${question.dim} ${question.text}`.toLowerCase();
    return !keyword || haystack.includes(keyword);
  });

  els.questionBankList.innerHTML = items
    .map((question) => `
      <article class="question-item">
        <div class="question-head">
          <div>
            <h4>${question.id} · ${question.dim}</h4>
            <small>${escapeHtml(findDimension(question.dim)?.name || question.dim)}</small>
          </div>
          <span class="question-choice">当前人格选 ${answerMap[question.id] ?? '—'}</span>
        </div>
        <p>${escapeHtml(question.text)}</p>
        <div class="option-list">
          ${question.options
            .map(
              (option) => `
                <div class="option-row ${answerMap[question.id] === option.value ? 'is-picked' : ''}">
                  <code>${option.value}</code>
                  <span>${escapeHtml(option.label)}</span>
                </div>
              `,
            )
            .join('')}
        </div>
      </article>
    `)
    .join('');
}

function getCurrentSolution() {
  return state.data.solutions[state.selectedCode];
}

function findDimension(id) {
  return state.data.dimensions.find((item) => item.id === id);
}

function buildChecklistText(solution) {
  const lines = [];
  const profile = solution.requestedProfile || {};
  lines.push(`${solution.requestedCode}${profile.cn ? ` / ${profile.cn}` : ''}`);
  lines.push('');
  lines.push('特殊题：');
  solution.specialAnswers.forEach((item) => {
    lines.push(`${item.id} => ${item.chooseValue} / ${item.chooseLabel}`);
  });
  lines.push('');
  lines.push('正式题：');
  solution.answers.forEach((item) => {
    lines.push(`${item.id} [${item.dim}/${item.targetLevel}] => ${item.chooseValue} / ${item.chooseLabel}`);
  });
  lines.push('');
  lines.push(`校验 => ${solution.verification.finalCode} / ${solution.verification.finalCn || '未命名'}`);
  return lines.join('\n');
}

function buildCompactMap(solution) {
  const mapping = {};
  solution.specialAnswers.forEach((item) => { mapping[item.id] = item.chooseValue; });
  solution.answers.forEach((item) => { mapping[item.id] = item.chooseValue; });
  return JSON.stringify(mapping, null, 2);
}

async function copyText(text, successText) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successText);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    showToast(successText);
  }
}

function downloadCurrentJson() {
  const payload = JSON.stringify(getCurrentSolution(), null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.selectedCode}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('JSON 文件已生成');
}

let toastTimer = null;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('is-visible'), 1600);
}

function formatDate(iso) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
