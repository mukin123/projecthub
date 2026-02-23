// ============================================
// FILE 9 of 9: JavaScript_Frontend.gs
// ============================================

function getJavaScript() {
  return `
let allData = [];
let allEmails = [];
let allProjects = [];
let activeProject = null;

// ============================================
// HELPERS
// ============================================

function esc(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** Format ISO/raw date string → "31 Jan 2026" */
function formatDate(str) {
  if (!str) return 'N/A';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Replace underscores with spaces for display */
function formatProjectName(name) {
  return (name || '').replace(/_/g, ' ');
}

/** Map phase string → CSS class name */
function getPhaseClass(phase) {
  const p = (phase || '').toLowerCase();
  if (p.includes('development'))           return 'development';
  if (p.includes('construction'))          return 'construction';
  if (p.includes('financ'))               return 'financing';
  if (p.includes('operat'))               return 'operations';
  if (p.includes('general') || p.includes('corporate')) return 'general-corporate';
  return 'active';
}

/** Short phase label for badge */
function phaseLabel(phase) {
  const p = (phase || '').toLowerCase();
  if (p.includes('development'))  return 'Dev';
  if (p.includes('construction')) return 'Const';
  if (p.includes('financ'))       return 'Finance';
  if (p.includes('operat'))       return 'Ops';
  if (p.includes('general') || p.includes('corporate')) return 'Corp';
  return phase || 'Active';
}

function getProjectColorClass(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return 'tag-color-' + Math.abs(hash % 7);
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  document.getElementById('themeIcon').textContent = isDark ? '☀️' : '🌙';
}

// ============================================
// DATA LOADING
// ============================================

async function loadData() {
  document.getElementById('sidebar').innerHTML = '<div class="loading">Loading...</div>';

  try {
    const [summariesRes, emailsRes, projectsRes] = await Promise.all([
      fetch(SCRIPT_URL + '?action=getSummaries'),
      fetch(SCRIPT_URL + '?action=getEmails'),
      fetch(SCRIPT_URL + '?action=getProjects').catch(() => null)
    ]);

    const summariesResult = await summariesRes.json();
    if (!summariesResult.success) throw new Error(summariesResult.error);
    allData = summariesResult.data || [];

    const emailsResult = await emailsRes.json();
    if (emailsResult.success) allEmails = emailsResult.data || [];

    if (projectsRes) {
      try {
        const projectsResult = await projectsRes.json();
        if (projectsResult.success) allProjects = projectsResult.data || [];
      } catch(e) { allProjects = []; }
    }

    renderProjectBar();

    if (allData.length === 0) {
      document.getElementById('sidebar').innerHTML =
        '<div class="empty-state">No data. Run Smart Process in Google Sheet.</div>';
      return;
    }

    const projects   = [...new Set(allData.map(i => i.project))].filter(Boolean).sort();
    const phases     = [...new Set(allData.map(i => i.phase))].filter(Boolean).sort();
    const categories = [...new Set(allData.map(i => i.category))].filter(Boolean).sort();

    document.getElementById('projectSelect').innerHTML =
      '<option value="">All Projects</option>' +
      projects.map(p => '<option>' + esc(p) + '</option>').join('');

    document.getElementById('phaseFilter').innerHTML =
      '<option value="">All Phases</option>' +
      phases.map(p => '<option>' + esc(p) + '</option>').join('');

    document.getElementById('categoryFilter').innerHTML =
      '<option value="">All Categories</option>' +
      categories.map(c => '<option>' + esc(c) + '</option>').join('');

    displayCards();
    await initMasterTasks();

  } catch (error) {
    document.getElementById('sidebar').innerHTML =
      '<div class="error-msg">Error: ' + esc(error.message) + '</div>';
  }
}

// ============================================
// CARD LIST
// ============================================

function displayCards() {
  const timeMonths = document.getElementById('timeFilter').value;
  const project    = document.getElementById('projectSelect').value;
  const phase      = document.getElementById('phaseFilter').value;
  const category   = document.getElementById('categoryFilter').value;
  const status     = document.getElementById('statusFilter').value;

  let filtered = allData;

  if (timeMonths !== 'all') {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - parseInt(timeMonths));
    filtered = filtered.filter(i => !i.last_updated || new Date(i.last_updated) >= cutoff);
  }

  if (activeProject) {
    filtered = filtered.filter(i => i.project === activeProject);
  } else if (project) {
    filtered = filtered.filter(i => i.project === project);
  }

  if (phase)    filtered = filtered.filter(i => i.phase === phase);
  if (category) filtered = filtered.filter(i => i.category === category);
  if (status)   filtered = filtered.filter(i => i.status === status);

  filtered.sort((a, b) => {
    const pa = (a.project || '').toLowerCase(), pb = (b.project || '').toLowerCase();
    if (pa !== pb) return pa.localeCompare(pb);
    const pha = (a.phase || '').toLowerCase(), phb = (b.phase || '').toLowerCase();
    if (pha !== phb) return pha.localeCompare(phb);
    return (a.category || '').toLowerCase().localeCompare((b.category || '').toLowerCase());
  });

  if (filtered.length === 0) {
    document.getElementById('sidebar').innerHTML = '<div class="empty-state">No matches found</div>';
    return;
  }

  let html = '';
  filtered.forEach((item, idx) => {
    const phClass = getPhaseClass(item.phase);
    const emailWord = item.email_count === 1 ? 'email' : 'emails';
    html +=
      '<div class="card" data-idx="' + idx + '">' +
        '<div class="card-header">' +
          '<div class="card-status ' + phClass + '"></div>' +
          '<div class="card-title">' +
            esc(item.project) + ' › ' + esc(item.phase || '—') + ' › ' + esc(item.category) +
          '</div>' +
        '</div>' +
        '<div class="card-meta">' +
          '<span>' + item.email_count + ' ' + emailWord + '</span>' +
          '<span class="card-badge ' + phClass + '">' + esc(phaseLabel(item.phase)) + '</span>' +
        '</div>' +
      '</div>';
  });

  document.getElementById('sidebar').innerHTML = html;

  document.querySelectorAll('.card').forEach((card, idx) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      showDetail(filtered[idx]);
    });
  });

  if (filtered.length > 0) document.querySelector('.card').click();
}

// ============================================
// DETAIL PANEL
// ============================================

function showDetail(item) {
  const emailLinks  = getEmailLinks(item);
  const tasks       = extractTasks(item);
  const attachments = extractAttachments(item);

  // ── Files & Emails tab ──
  let emailsHTML = '';
  if (emailLinks.length > 0) {
    emailsHTML = '<div class="section-title">📧 Related Emails (' + emailLinks.length + ')</div>';
    emailsHTML += '<div class="email-list">';
    emailLinks.forEach((email, i) => {
      emailsHTML +=
        '<a href="' + email.url + '" target="_blank" class="email-item">' +
          '<div class="email-item-header">' +
            '<div class="email-item-title">' +
              '<span class="email-item-icon">📩</span>' +
              esc(email.sender) +
            '</div>' +
          '</div>' +
          '<div class="email-item-meta">' +
            '<div class="email-meta-label">Date:</div>' +
            '<div class="email-meta-value">' + esc(email.date) + (email.time ? ' · ' + esc(email.time) : '') + '</div>' +
          '</div>' +
        '</a>';
    });
    emailsHTML += '</div>';
  } else {
    emailsHTML = '<div class="section-title">📧 Related Emails</div><div class="empty-state">No emails found</div>';
  }

  let attachmentsHTML = '';
  if (attachments.length > 0) {
    attachmentsHTML = '<div class="section-divider"></div>';
    attachmentsHTML += '<div class="section-title">📎 Attachments</div>';
    attachmentsHTML += '<div class="attachments-grid">';
    attachments.forEach(att => {
      attachmentsHTML +=
        '<a href="' + att.url + '" target="_blank" class="attachment-card">' +
          '<div class="attachment-icon">' + att.icon + '</div>' +
          '<div class="attachment-name">' + esc(att.name) + '</div>' +
          '<div class="attachment-type">' + esc(att.type) + '</div>' +
        '</a>';
    });
    attachmentsHTML += '</div>';
  }

  // ── Tasks tab ──
  let tasksHTML = '';
  if (tasks.length > 0) {
    tasksHTML = '<div class="tasks-table-wrapper"><table class="tasks-table">';
    tasksHTML += '<thead><tr><th>Status</th><th>Task</th><th>Responsible</th></tr></thead><tbody>';
    tasks.forEach(t => {
      tasksHTML +=
        '<tr>' +
          '<td><span class="task-status ' + t.status + '">' + t.status + '</span></td>' +
          '<td class="task-description">' + esc(t.description) + '</td>' +
          '<td class="task-responsible">' + esc(t.responsible || '—') + '</td>' +
        '</tr>';
    });
    tasksHTML += '</tbody></table></div>';
  } else {
    tasksHTML = '<div class="empty-state">No tasks</div>';
  }

  const phClass = getPhaseClass(item.phase);

  document.getElementById('detailPanel').innerHTML =
    '<div class="detail-header">' +
      '<h2>' + esc(item.project) + ' › ' + esc(item.phase || '—') + ' › ' + esc(item.category) + '</h2>' +
      '<div class="detail-meta">' +
        '<div class="detail-meta-item">📧 ' + item.email_count + (item.email_count === 1 ? ' email' : ' emails') + '</div>' +
        '<div class="detail-meta-item">📅 ' + formatDate(item.time_period || item.last_updated) + '</div>' +
        '<div class="detail-meta-item"><span class="card-badge ' + phClass + '" style="font-size:11px;">' + esc(item.phase || item.status) + '</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="tabs">' +
      '<div class="tab active" data-tab="summary">Summary</div>' +
      '<div class="tab" data-tab="tasks">Tasks</div>' +
      '<div class="tab" data-tab="files">Files & Emails</div>' +
    '</div>' +
    '<div class="tab-content active" id="summary-content">' +
      '<div class="summary-section"><h3>Executive Summary</h3><p>' + esc(item.executive_summary || 'No summary') + '</p></div>' +
      '<div class="summary-section"><h3>Key Points</h3><pre>' + esc(item.key_points || 'None') + '</pre></div>' +
      (item.risk_areas && item.risk_areas !== 'None identified' ?
        '<div class="summary-section"><h3>Risk Areas</h3><pre>' + esc(item.risk_areas) + '</pre></div>' : '') +
      '<div class="summary-section"><h3>Next Steps</h3><pre>' + esc(item.next_steps || 'None') + '</pre></div>' +
    '</div>' +
    '<div class="tab-content" id="tasks-content">' + tasksHTML + '</div>' +
    '<div class="tab-content" id="files-content">' + emailsHTML + attachmentsHTML + '</div>';

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      document.getElementById(this.dataset.tab + '-content').classList.add('active');
    });
  });
}

function getEmailLinks(item) {
  const links = [];
  const matches = allEmails.filter(e =>
    e.project === item.project && e.phase === item.phase && e.category === item.category
  );
  matches.forEach(email => {
    if (email.mail) {
      const urls = email.mail.match(/(https:\\/\\/docs\\.google\\.com\\/[^\\s<>"]+)/g);
      if (urls) {
        urls.forEach(url => {
          let dateObj = null, isValidDate = false;
          if (email.date) {
            const clean = String(email.date)
              .replace(/\\s+at\\s+/i, ' ')
              .replace(/\\s+(EET|EST|EDT|PST|PDT|CET|CEST|UTC|GMT|MSK|JST|IST)\\b/gi, '')
              .trim();
            dateObj = new Date(clean);
            isValidDate = !isNaN(dateObj.getTime());
          }
          links.push({
            url,
            sender: email.sender || 'Unknown',
            date: isValidDate
              ? dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : (email.date || 'N/A'),
            time: isValidDate
              ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''
          });
        });
      }
    }
  });
  return links;
}

function extractTasks(item) {
  const tasks = [];
  [
    { field: item.action_items, status: 'todo' },
    { field: item.completed_items, status: 'done' }
  ].forEach(({ field, status }) => {
    if (field && field !== 'None identified') {
      field.split('\\n').forEach(line => {
        const clean = line.replace(/^[•\\-*]\\s*/, '').trim();
        if (clean.length > 3) {
          const owner    = clean.match(/\\(Owner:\\s*([^)]+)\\)/i)?.[1] || clean.match(/\\(([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\)/)?.[1];
          const deadline = clean.match(/\\((\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|\\w+\\s+\\d{1,2},?\\s*\\d{4}?)\\)/i)?.[1];
          const desc     = clean.replace(/\\([^)]+\\)/g, '').trim();
          tasks.push({ status, description: desc || clean, responsible: owner || '', deadline: deadline || '' });
        }
      });
    }
  });
  return tasks;
}

function extractAttachments(item) {
  const attachments = [];
  const text = [item.executive_summary, item.key_points].join(' ');
  const urls = [...new Set(text.match(/(https?:\\/\\/[^\\s<>"{}|\\\\^\\[\\]\` ]+)/gi) || [])];
  urls.forEach(url => {
    url = url.replace(/[.,;:!?)]+$/, '');
    let icon = '📄', type = 'Link', name = 'Document';
    if (url.includes('docs.google.com')) {
      if (url.includes('/spreadsheets/')) { icon = '📊'; type = 'Sheets'; name = 'Spreadsheet'; }
      else if (url.includes('/document/'))     { icon = '📝'; type = 'Docs';   name = 'Document'; }
      else if (url.includes('/presentation/')) { icon = '📊'; type = 'Slides'; name = 'Presentation'; }
      else { icon = '📁'; type = 'Drive'; name = 'File'; }
    } else if (url.match(/\\.(pdf|PDF)($|\\?)/)) {
      icon = '📕'; type = 'PDF'; name = 'PDF';
    }
    attachments.push({ url, icon, type, name });
  });
  return attachments;
}

// ============================================
// PROJECT BAR
// ============================================

function renderProjectBar() {
  const bar = document.getElementById('projectBar');
  if (!bar) return;

  // Derive project names from allData (summaries); enrich with allProjects when available
  const projectsFromData = [...new Set(allData.map(i => i.project).filter(Boolean))].sort();
  const projectsMap = {};
  allProjects.forEach(p => { if (p.project) projectsMap[p.project] = p; });

  let html = '<button class="project-chip' + (!activeProject ? ' active' : '') +
             '" data-project="">All Projects</button>';

  projectsFromData.forEach(name => {
    const isActive = activeProject === name;
    const displayName = formatProjectName(name);
    const meta = projectsMap[name];
    const statusLabel = meta && meta.status && meta.status !== 'Active' ? ' · ' + meta.status : '';
    html +=
      '<button class="project-chip' + (isActive ? ' active' : '') +
      '" data-project="' + esc(name) + '">' +
        esc(displayName) +
        (statusLabel ? '<span style="opacity:0.6;font-weight:400;font-size:11px;">' + esc(statusLabel) + '</span>' : '') +
      '</button>';
  });

  bar.innerHTML = html;
  bar.querySelectorAll('.project-chip').forEach(chip => {
    chip.addEventListener('click', () => selectProject(chip.dataset.project || null));
  });
}

function selectProject(name) {
  activeProject = name || null;
  renderProjectBar();
  renderProjectDashboard();
  displayCards();
}

// ============================================
// PROJECT RIGHT PANEL
// ============================================

function toggleProjectPanel() {
  const panel = document.getElementById('projectDashboard');
  const btn   = document.getElementById('panelCollapseBtn');
  if (!panel) return;
  panel.classList.toggle('collapsed');
  if (btn) btn.textContent = panel.classList.contains('collapsed') ? '›' : '‹';
}

function renderProjectDashboard() {
  const panel      = document.getElementById('projectDashboard');
  const mainContent = document.getElementById('mainContent');
  const panelBody  = document.getElementById('panelBody');
  const nameEl     = document.getElementById('panelProjectName');
  if (!panel) return;

  if (!activeProject) {
    panel.style.display = 'none';
    mainContent.classList.remove('has-project-panel');
    return;
  }

  const project = allProjects.find(p => p.project === activeProject) || {};

  if (nameEl) nameEl.textContent = formatProjectName(activeProject);

  // ── Development ──
  const stageIndex = parseInt(project.dev_stage_index) || 0;
  const devHTML = getVerticalStepperHTML(stageIndex);

  // ── Construction ──
  const allZero = !parseFloat(project.civil_works_pct) &&
                  !parseFloat(project.pv_ramming_pct) &&
                  !parseFloat(project.pv_mounting_pct) &&
                  !parseFloat(project.bess_pct) &&
                  !parseFloat(project.electrical_pct) &&
                  !parseFloat(project.commissioning_pct);
  const constructionHTML = allZero
    ? '<div class="construction-not-started"><div class="ns-icon">🏗️</div><p>Not started yet</p></div>'
    : getPanelConstructionHTML(project);

  // ── Operation ──
  const opStatus = project.operation_status &&
                   project.operation_status !== '—' &&
                   project.operation_status !== ''
    ? '<div class="panel-op-status">🔋 ' + esc(String(project.operation_status)) + '</div>'
    : '<div class="panel-op-placeholder"><div class="op-icon">🔌</div><p>Coming Soon</p></div>';

  panelBody.innerHTML =
    '<div class="panel-section">' +
      '<div class="panel-section-title">🏗️ Development</div>' +
      devHTML +
    '</div>' +
    '<div class="panel-section">' +
      '<div class="panel-section-title">⚙️ Construction</div>' +
      constructionHTML +
    '</div>' +
    '<div class="panel-section">' +
      '<div class="panel-section-title">⚡ Operation</div>' +
      opStatus +
    '</div>';

  panel.style.display = 'flex';
  mainContent.classList.add('has-project-panel');
}

/** Vertical stepper for the right panel */
function getVerticalStepperHTML(stageIndex) {
  const steps = [
    { name: 'Land & Prep',    icon: '📍' },
    { name: 'Environment',    icon: '🌍' },
    { name: 'Grid Sync',      icon: '⚡' },
    { name: 'Tech Design',    icon: '📐' },
    { name: 'Permitting',     icon: '🏛️' }
  ];
  const current = parseInt(stageIndex) || 0;
  let html = '<div class="stepper-vertical">';
  steps.forEach((step, idx) => {
    const isLast    = idx === steps.length - 1;
    let statusClass = '';
    let icon        = step.icon;
    if (idx < current)      { statusClass = 'completed'; icon = '✓'; }
    else if (idx === current) { statusClass = 'active'; }

    html +=
      '<div class="step-v ' + statusClass + '">' +
        '<div class="step-v-left">' +
          '<div class="step-v-circle">' + icon + '</div>' +
          (!isLast ? '<div class="step-v-line"></div>' : '') +
        '</div>' +
        '<div class="step-v-content">' +
          '<div class="step-v-label">' + step.name + '</div>' +
        '</div>' +
      '</div>';
  });
  html += '</div>';
  return html;
}

/** Compact construction KPI for the right panel */
function getPanelConstructionHTML(project) {
  const milestones = [
    { name: 'Civil Works',   pct: parseInt(project.civil_works_pct)   || 0 },
    { name: 'PV Ramming',    pct: parseInt(project.pv_ramming_pct)    || 0 },
    { name: 'PV Mounting',   pct: parseInt(project.pv_mounting_pct)   || 0 },
    { name: 'BESS Delivery', pct: parseInt(project.bess_pct)          || 0 },
    { name: 'Electrical',    pct: parseInt(project.electrical_pct)    || 0 },
    { name: 'Commissioning', pct: parseInt(project.commissioning_pct) || 0 }
  ];
  const weights = [5, 10, 15, 40, 20, 10];

  let total = 0;
  milestones.forEach((m, i) => { total += (m.pct / 100) * weights[i]; });
  total = Math.round(total);

  let listHTML = '<div class="panel-milestones">';
  milestones.forEach(m => {
    const isDone      = m.pct === 100;
    const inProgress  = m.pct > 0 && m.pct < 100;
    const icon        = isDone ? '✓' : (inProgress ? '↻' : '');
    const borderStyle = inProgress ? 'border-color:var(--accent-primary);color:var(--accent-primary);' : '';
    listHTML +=
      '<div class="panel-milestone-item ' + (isDone ? 'done' : '') + '">' +
        '<div class="milestone-checkbox" style="' + borderStyle + '">' + icon + '</div>' +
        '<span class="m-name">' + m.name + '</span>' +
        '<span class="m-pct">' + m.pct + '%</span>' +
      '</div>';
  });
  listHTML += '</div>';

  return '<div class="panel-kpi-wrap">' +
    '<div class="kpi-ring-container" style="--progress:' + total + '%;">' +
      '<div class="kpi-ring-inner">' +
        '<div class="kpi-value">' + total + '%</div>' +
        '<div class="kpi-label">Done</div>' +
      '</div>' +
    '</div>' +
    listHTML +
  '</div>';
}

/** Horizontal stepper (kept for any standalone use) */
function getDevelopmentStepperHTML(stageIndex) {
  const steps = [
    { name: 'Land & Prep', icon: '📍' },
    { name: 'Environment', icon: '🌍' },
    { name: 'Grid Sync',   icon: '⚡' },
    { name: 'Tech Design', icon: '📐' },
    { name: 'Permitting',  icon: '🏛️' }
  ];
  const current   = parseInt(stageIndex) || 0;
  const fillWidth = current === 0 ? 0 : (current / (steps.length - 1)) * 100;

  let html = '<div class="stepper-container">' +
    '<div class="stepper-line"></div>' +
    '<div class="stepper-line-fill" style="width:calc(' + fillWidth + '% * 0.8);"></div>';

  steps.forEach((step, idx) => {
    let statusClass = '', icon = step.icon;
    if (idx < current)      { statusClass = 'completed'; icon = '✓'; }
    else if (idx === current) { statusClass = 'active'; }
    html +=
      '<div class="step ' + statusClass + '">' +
        '<div class="step-circle">' + icon + '</div>' +
        '<div class="step-label">' + step.name + '</div>' +
      '</div>';
  });
  html += '</div>';
  return html;
}

// ============================================
// MASTER TASKS
// ============================================

let isTaskView   = false;
let taskSortCol  = 'project';
let taskSortAsc  = true;
let phaseCategories = {};

document.querySelectorAll('#masterTaskTable th').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.getAttribute('data-sort');
    if (taskSortCol === col) { taskSortAsc = !taskSortAsc; }
    else { taskSortCol = col; taskSortAsc = true; }
    renderMasterTasks();
  });
});

function renderMasterTasks() {
  const timeMonths = document.getElementById('timeFilter').value;
  const project    = document.getElementById('projectSelect').value;
  const phase      = document.getElementById('phaseFilter').value;
  const category   = document.getElementById('categoryFilter').value;

  let allPendingTasks = [];
  allData.forEach(item => {
    if (item.status === 'Archived') return;
    if (timeMonths !== 'all') {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - parseInt(timeMonths));
      if (item.last_updated && new Date(item.last_updated) < cutoff) return;
    }
    if (project  && item.project  !== project)  return;
    if (phase    && item.phase    !== phase)    return;
    if (category && item.category !== category) return;

    extractTasks(item).forEach(task => {
      if (task.status === 'todo') {
        allPendingTasks.push({
          project: item.project, phase: item.phase, category: item.category,
          description: task.description, owner: task.responsible || '—', deadline: task.deadline || '—'
        });
      }
    });
  });

  allPendingTasks.sort((a, b) => {
    const va = (a[taskSortCol] || '').toLowerCase();
    const vb = (b[taskSortCol] || '').toLowerCase();
    if (va < vb) return taskSortAsc ? -1 : 1;
    if (va > vb) return taskSortAsc ?  1 : -1;
    return 0;
  });

  document.getElementById('taskCount').textContent = allPendingTasks.length + ' Pending Tasks';

  const tbody = document.getElementById('masterTasksTableBody');
  if (allPendingTasks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">No pending tasks! 🎉</td></tr>';
    return;
  }

  let rowsHtml = '';
  allPendingTasks.forEach(task => {
    rowsHtml +=
      '<tr>' +
        '<td><span class="project-badge ' + getProjectColorClass(task.project) + '">' + esc(formatProjectName(task.project)) + '</span></td>' +
        '<td><span class="phase-badge">' + esc(task.phase || '—') + '</span></td>' +
        '<td style="font-size:11px;color:var(--text-tertiary);">' + esc(task.category) + '</td>' +
        '<td class="master-task-description">' + esc(task.description) + '</td>' +
        '<td class="master-task-owner">' + esc(task.owner) + '</td>' +
        '<td class="master-task-deadline">' + esc(task.deadline) + '</td>' +
      '</tr>';
  });
  tbody.innerHTML = rowsHtml;
}

async function loadCategoryReference() {
  try {
    const response = await fetch(SCRIPT_URL + '?action=getCategoryReference');
    const result   = await response.json();
    if (result.success) phaseCategories = result.data;
  } catch (e) { phaseCategories = {}; }
}

function getAllPhases() { return Object.keys(phaseCategories).sort(); }
function getCategoriesForPhase(phase) { return phaseCategories[phase] || []; }

function displayMasterTasks() {
  try {
    const tasks = buildMasterTasksTable();
    const pf  = document.getElementById('masterProjectFilter').value;
    const phf = document.getElementById('masterPhaseFilter').value;
    const cf  = document.getElementById('masterCategoryFilter').value;

    let filtered = tasks;
    if (pf)  filtered = filtered.filter(t => t.project  === pf);
    if (phf) filtered = filtered.filter(t => t.phase    === phf);
    if (cf)  filtered = filtered.filter(t => t.category === cf);

    document.getElementById('taskCount').textContent = filtered.length + ' PENDING TASKS';

    if (filtered.length === 0) {
      document.getElementById('masterTasksTableBody').innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:60px;color:var(--text-tertiary);">No pending tasks found</td></tr>';
      return;
    }

    let html = '';
    filtered.forEach(task => {
      html +=
        '<tr>' +
          '<td><span class="project-badge">' + esc(formatProjectName(task.project)) + '</span></td>' +
          '<td><span class="phase-badge">' + esc(task.phase) + '</span></td>' +
          '<td>' + esc(task.category) + '</td>' +
          '<td class="master-task-description">' + esc(task.description) + '</td>' +
          '<td class="master-task-owner">' + esc(task.owner || '—') + '</td>' +
          '<td class="master-task-deadline">' + esc(task.deadline || '—') + '</td>' +
        '</tr>';
    });
    document.getElementById('masterTasksTableBody').innerHTML = html;
  } catch (error) {
    document.getElementById('masterTasksTableBody').innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:40px;color:#dc2626;">Error: ' + error.message + '</td></tr>';
  }
}

function buildMasterTasksTable() {
  const allTasks = [];
  allData.forEach(item => {
    if (item.action_items && item.action_items !== 'None identified') {
      const lines = item.action_items.split('\\n').filter(l => l.trim());
      lines.forEach(line => {
        const cleaned = line.replace(/^[•\\-*]\\s*/, '').trim();
        if (cleaned.length > 3) {
          const ownerMatch    = cleaned.match(/\\(Owner:\\s*([^)]+)\\)/i) || cleaned.match(/\\(([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\)/);
          const deadlineMatch = cleaned.match(/\\((\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|\\w+\\s+\\d{1,2},?\\s*\\d{4}?)\\)/i);
          const description   = cleaned.replace(/\\([^)]+\\)/g, '').trim();
          allTasks.push({
            project: item.project, phase: item.phase || 'Unknown', category: item.category,
            description: description || cleaned,
            owner: ownerMatch ? ownerMatch[1].trim() : '',
            deadline: deadlineMatch ? deadlineMatch[1] : ''
          });
        }
      });
    }
  });
  return allTasks;
}

function onPhaseFilterChange() {
  const selectedPhase  = document.getElementById('masterPhaseFilter').value;
  const categorySelect = document.getElementById('masterCategoryFilter');
  if (!selectedPhase) {
    const all = [...new Set(allData.map(i => i.category))].filter(Boolean).sort();
    categorySelect.innerHTML = '<option value="">All Categories</option>' + all.map(c => '<option>' + esc(c) + '</option>').join('');
  } else {
    const cats = getCategoriesForPhase(selectedPhase);
    categorySelect.innerHTML = '<option value="">All Categories</option>' + cats.map(c => '<option>' + esc(c) + '</option>').join('');
  }
  categorySelect.value = '';
  displayMasterTasks();
}

function onMainPhaseFilterChange() {
  const selectedPhase  = document.getElementById('phaseFilter').value;
  const categorySelect = document.getElementById('categoryFilter');
  if (!selectedPhase) {
    const all = [...new Set(allData.map(i => i.category))].filter(Boolean).sort();
    categorySelect.innerHTML = '<option value="">All Categories</option>' + all.map(c => '<option>' + esc(c) + '</option>').join('');
  } else {
    const cats = getCategoriesForPhase(selectedPhase);
    categorySelect.innerHTML = '<option value="">All Categories</option>' + cats.map(c => '<option>' + esc(c) + '</option>').join('');
  }
  categorySelect.value = '';
  displayCards();
  if (isTaskView) renderMasterTasks();
}

async function initMasterTasks() {
  try {
    if (!document.getElementById('masterProjectFilter')) return;
    await loadCategoryReference();

    const projects = [...new Set(allData.map(i => i.project))].filter(Boolean).sort();
    document.getElementById('masterProjectFilter').innerHTML =
      '<option value="">All Projects</option>' + projects.map(p => '<option>' + esc(p) + '</option>').join('');

    const phases = getAllPhases();
    document.getElementById('masterPhaseFilter').innerHTML =
      '<option value="">All Phases</option>' + phases.map(p => '<option>' + esc(p) + '</option>').join('');

    const cats = [...new Set(allData.map(i => i.category))].filter(Boolean).sort();
    document.getElementById('masterCategoryFilter').innerHTML =
      '<option value="">All Categories</option>' + cats.map(c => '<option>' + esc(c) + '</option>').join('');

    document.getElementById('masterProjectFilter').addEventListener('change', displayMasterTasks);
    document.getElementById('masterPhaseFilter').addEventListener('change', onPhaseFilterChange);
    document.getElementById('masterCategoryFilter').addEventListener('change', displayMasterTasks);

    displayMasterTasks();
  } catch (error) {
    if (document.getElementById('masterTasksTableBody')) {
      document.getElementById('masterTasksTableBody').innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:40px;color:#dc2626;">Init Error: ' + error.message + '</td></tr>';
    }
  }
}

// ============================================
// APP INIT
// ============================================

function initializeApp() {
  // Restore dark mode
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = '☀️';
  }

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', loadData);

  // Task view toggle
  const taskViewBtn = document.getElementById('taskViewBtn');
  if (taskViewBtn) {
    taskViewBtn.addEventListener('click', () => {
      isTaskView = !isTaskView;
      const masterView   = document.getElementById('masterTaskView');
      const sidebar      = document.getElementById('sidebar');
      const detailPanel  = document.getElementById('detailPanel');
      const projectPanel = document.getElementById('projectDashboard');

      const mainFilters  = document.getElementById('mainFilters');
      const chipBar      = document.getElementById('projectBarWrapper');
      if (isTaskView) {
        if (sidebar)      sidebar.style.display      = 'none';
        if (detailPanel)  detailPanel.style.display  = 'none';
        if (projectPanel) projectPanel.style.display = 'none';
        if (mainFilters)  mainFilters.style.display  = 'none';
        if (chipBar)      chipBar.style.display      = 'none';
        if (masterView)   masterView.classList.add('active');
        taskViewBtn.style.background = 'var(--accent-primary)';
        taskViewBtn.style.color      = 'white';
        renderMasterTasks();
      } else {
        if (sidebar)     sidebar.style.display     = 'block';
        if (detailPanel) detailPanel.style.display = 'block';
        if (mainFilters) mainFilters.style.display = '';
        if (chipBar)     chipBar.style.display     = '';
        if (masterView)  masterView.classList.remove('active');
        taskViewBtn.style.background = '';
        taskViewBtn.style.color      = '';
        // Restore right panel only if a project is selected
        if (activeProject && projectPanel) {
          projectPanel.style.display = 'flex';
        }
      }
    });
  }

  // Phase filter cascades category
  const phaseFilterEl = document.getElementById('phaseFilter');
  if (phaseFilterEl) phaseFilterEl.addEventListener('change', onMainPhaseFilterChange);

  ['timeFilter', 'projectSelect', 'categoryFilter', 'statusFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      displayCards();
      if (isTaskView) renderMasterTasks();
    });
  });

  loadData();
}

window.addEventListener('DOMContentLoaded', initializeApp);
  `;
}
