// =============================================
// GitLens AI — GitHub Profile Analyzer
// UnsaidTalks AICore Connect Hackathon 2026
// =============================================

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

// ── DOM References ──────────────────────────
const inputEl     = document.getElementById('github-input');
const analyzeBtn  = document.getElementById('analyze-btn');
const loadingEl   = document.getElementById('loading');
const errorBox    = document.getElementById('error-box');
const resultsEl   = document.getElementById('results');
const heroSection = document.getElementById('hero-section');
const resetBtn    = document.getElementById('reset-btn');

// ── Event Listeners ─────────────────────────
analyzeBtn.addEventListener('click', startAnalysis);
inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') startAnalysis(); });
resetBtn.addEventListener('click', resetUI);

// ── Main Flow ────────────────────────────────
async function startAnalysis() {
  const username = inputEl.value.trim().replace(/^@/, '');
  if (!username) { shakeInput(); return; }

  try {
    showLoading();
    hideError();

    // Step 1: Fetch user profile
    setLoadingStep(1);
    const user = await fetchGitHubUser(username);

    // Step 2: Fetch repositories
    setLoadingStep(2);
    const repos = await fetchGitHubRepos(username);

    // Step 3: Compute scores
    const scores = computeScores(user, repos);

    // Render static parts immediately
    hideLoading();
    renderProfile(user, scores);
    renderBreakdown(scores);
    renderRepos(repos);
    renderRecruiterView(user, repos, scores);
    showResults();

    // Step 4: Stream AI analysis
    setLoadingStep(3);
    await streamAIAnalysis(user, repos, scores);
    renderNextSteps(scores);

  } catch (err) {
    hideLoading();
    showError(err.message || 'Something went wrong. Please try again.');
  }
}

// ── GitHub API ───────────────────────────────
async function fetchGitHubUser(username) {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (res.status === 404) throw new Error(`User "${username}" not found on GitHub.`);
  if (res.status === 403) throw new Error('GitHub API rate limit hit. Please wait a minute and try again.');
  if (!res.ok) throw new Error(`GitHub error: ${res.statusText}`);
  return res.json();
}

async function fetchGitHubRepos(username) {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`
  );
  if (!res.ok) throw new Error('Failed to fetch repositories.');
  const repos = await res.json();
  return repos.filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count);
}

// ── Scoring Engine ───────────────────────────
function computeScores(user, repos) {
  const scores = {};

  // 1. Profile Completeness (0-20)
  let profile = 0;
  if (user.name)       profile += 4;
  if (user.bio)        profile += 5;
  if (user.blog)       profile += 4;
  if (user.location)   profile += 3;
  if (user.company)    profile += 2;
  if (user.email)      profile += 2;
  scores.profile = Math.min(profile, 20);

  // 2. Activity (0-20)
  const daysSinceUpdate = (Date.now() - new Date(user.updated_at)) / 86400000;
  const activityScore = daysSinceUpdate < 7  ? 20 :
                        daysSinceUpdate < 30 ? 16 :
                        daysSinceUpdate < 90 ? 11 :
                        daysSinceUpdate < 365 ? 6 : 2;
  scores.activity = activityScore;

  // 3. Repository Quality (0-20)
  const nonEmpty = repos.filter(r => r.size > 0);
  const withDesc  = repos.filter(r => r.description).length;
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const withTopics = repos.filter(r => r.topics && r.topics.length > 0).length;
  let repoScore = 0;
  repoScore += Math.min(nonEmpty.length / repos.length * 7, 7);
  repoScore += Math.min(withDesc / Math.max(repos.length, 1) * 5, 5);
  repoScore += Math.min(totalStars * 0.5, 5);
  repoScore += Math.min(withTopics / Math.max(repos.length, 1) * 3, 3);
  scores.repoQuality = Math.round(Math.min(repoScore, 20));

  // 4. Language Diversity (0-20)
  const langs = new Set(repos.map(r => r.language).filter(Boolean));
  const langScore = langs.size >= 5 ? 20 : langs.size >= 3 ? 15 : langs.size >= 2 ? 10 : langs.size >= 1 ? 6 : 0;
  scores.languageDiversity = langScore;
  scores.languages = [...langs];

  // 5. Community Impact (0-20)
  const followers = user.followers;
  const forks = repos.reduce((s, r) => s + r.forks_count, 0);
  let impact = 0;
  impact += Math.min(followers * 0.3, 8);
  impact += Math.min(forks * 0.5, 7);
  impact += Math.min(totalStars * 0.3, 5);
  scores.communityImpact = Math.round(Math.min(impact, 20));

  // Total
  scores.total = scores.profile + scores.activity + scores.repoQuality +
                 scores.languageDiversity + scores.communityImpact;

  // Grade
  scores.grade = scores.total >= 85 ? { label: 'Exceptional', color: '#00ff88' } :
                 scores.total >= 70 ? { label: 'Strong',       color: '#38bdf8' } :
                 scores.total >= 55 ? { label: 'Good',         color: '#7c3aed' } :
                 scores.total >= 40 ? { label: 'Average',      color: '#f59e0b' } :
                                      { label: 'Needs Work',   color: '#ef4444' };

  scores.totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  scores.totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
  scores.publicRepos = repos.length;
  scores.reposWithDesc = repos.filter(r => r.description).length;

  return scores;
}

// ── Render: Profile Card ─────────────────────
function renderProfile(user, scores) {
  const card = document.getElementById('profile-card');
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (scores.total / 100) * circumference;
  const gradeColor = scores.grade.color;

  card.innerHTML = `
    <img class="profile-avatar" src="${user.avatar_url}" alt="${user.login}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'96\\' height=\\'96\\'><rect fill=\\'%23222\\' width=\\'96\\' height=\\'96\\'><text x=\\'48\\' y=\\'60\\' font-size=\\'40\\' text-anchor=\\'middle\\' fill=\\'%2300ff88\\'>?</text></rect></svg>'"/>
    <div class="profile-info">
      <div class="profile-name">${user.name || user.login}</div>
      <div class="profile-username">@${user.login}</div>
      ${user.bio ? `<div class="profile-bio">${escHtml(user.bio)}</div>` : '<div class="profile-bio" style="color:#ef4444;font-style:italic">⚠ No bio — recruiters notice this immediately</div>'}
      <div class="profile-stats">
        <div class="stat-item"><span class="stat-value">${fmtNum(user.public_repos)}</span><span class="stat-label">Repos</span></div>
        <div class="stat-item"><span class="stat-value">${fmtNum(user.followers)}</span><span class="stat-label">Followers</span></div>
        <div class="stat-item"><span class="stat-value">${fmtNum(scores.totalStars)}</span><span class="stat-label">Stars</span></div>
        <div class="stat-item"><span class="stat-value">${scores.languages.slice(0,4).join(', ') || 'N/A'}</span><span class="stat-label">Top Languages</span></div>
      </div>
    </div>
    <div class="score-section">
      <div class="donut-wrap">
        <svg class="donut-svg" width="120" height="120" viewBox="0 0 100 100">
          <circle class="donut-bg" cx="50" cy="50" r="44"/>
          <circle class="donut-fill" cx="50" cy="50" r="44"
            stroke="${gradeColor}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${circumference}"
            id="donut-circle"/>
        </svg>
        <div class="donut-score">
          <div class="score-num" id="score-counter">0</div>
          <div class="score-label">/ 100</div>
        </div>
      </div>
      <div class="score-grade" style="background: ${gradeColor}22; color: ${gradeColor}; border: 1px solid ${gradeColor}44;">
        ${scores.grade.label}
      </div>
    </div>
  `;

  // Animate score
  setTimeout(() => {
    document.getElementById('donut-circle').style.strokeDashoffset = dashOffset;
    animateCounter('score-counter', 0, scores.total, 1200);
  }, 100);
}

// ── Render: Score Breakdown ──────────────────
function renderBreakdown(scores) {
  const grid = document.getElementById('breakdown-grid');
  const items = [
    {
      label: '👤 Profile Completeness',
      score: scores.profile, max: 20,
      color: '#00ff88',
      note: scores.profile >= 16 ? 'Excellent — all key fields filled' :
            scores.profile >= 10 ? 'Add bio, website, or location' :
            'Critical gaps: missing name, bio, and links'
    },
    {
      label: '⚡ Recent Activity',
      score: scores.activity, max: 20,
      color: '#38bdf8',
      note: scores.activity >= 16 ? 'Active — pushing code regularly' :
            scores.activity >= 10 ? 'Moderate — try to commit weekly' :
            'Inactive profile — recruiters want to see recent work'
    },
    {
      label: '📦 Repository Quality',
      score: scores.repoQuality, max: 20,
      color: '#7c3aed',
      note: `${scores.reposWithDesc}/${scores.publicRepos} repos have descriptions. ${scores.totalStars} total stars earned.`
    },
    {
      label: '🌐 Language Diversity',
      score: scores.languageDiversity, max: 20,
      color: '#f59e0b',
      note: `${scores.languages.length} languages used: ${scores.languages.slice(0, 3).join(', ')}${scores.languages.length > 3 ? ' & more' : ''}`
    },
    {
      label: '🌟 Community Impact',
      score: scores.communityImpact, max: 20,
      color: '#ef4444',
      note: `${scores.totalStars} stars · ${scores.totalForks} forks · ${scores.publicRepos} public repos`
    }
  ];

  grid.innerHTML = items.map(item => `
    <div class="breakdown-card">
      <div class="breakdown-header">
        <div class="breakdown-label">${item.label}</div>
        <div class="breakdown-score">${item.score}/${item.max}</div>
      </div>
      <div class="breakdown-bar">
        <div class="breakdown-fill" style="width:0%; background:${item.color};" data-width="${(item.score/item.max)*100}"></div>
      </div>
      <div class="breakdown-note">${item.note}</div>
    </div>
  `).join('');

  setTimeout(() => {
    document.querySelectorAll('.breakdown-fill').forEach(el => {
      el.style.width = el.dataset.width + '%';
    });
  }, 200);
}

// ── Render: Top Repos ────────────────────────
function renderRepos(repos) {
  const grid = document.getElementById('repos-grid');
  const top = repos.slice(0, 6);
  if (!top.length) {
    grid.innerHTML = '<div style="color:var(--muted);font-size:.9rem;">No public repositories found.</div>';
    return;
  }

  grid.innerHTML = top.map(repo => {
    const impact = repo.stargazers_count >= 10 ? { label: 'High Impact', cls: 'impact-high' } :
                   repo.stargazers_count >= 3  ? { label: 'Notable',     cls: 'impact-mid' } :
                                                 { label: 'Starter',     cls: 'impact-low' };
    const updatedAgo = daysAgo(repo.updated_at);
    return `
      <div class="repo-card">
        <div class="repo-name">
          <a href="${repo.html_url}" target="_blank" rel="noopener">${escHtml(repo.name)}</a>
          <span class="repo-impact ${impact.cls}">${impact.label}</span>
        </div>
        <div class="repo-desc">${repo.description ? escHtml(repo.description) : '<em style="color:var(--danger);font-size:.8rem">⚠ No description — add one!</em>'}</div>
        <div class="repo-meta">
          ${repo.language ? `<span class="lang-chip">${repo.language}</span>` : ''}
          <span>⭐ ${repo.stargazers_count}</span>
          <span>🍴 ${repo.forks_count}</span>
          <span>🕐 ${updatedAgo}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ── Render: Recruiter View ───────────────────
function renderRecruiterView(user, repos, scores) {
  const card = document.getElementById('recruiter-card');
  const topRepo = repos[0];
  const noDesc = repos.filter(r => !r.description).length;
  const hasReadme = repos.some(r => r.name.toLowerCase() === user.login.toLowerCase());

  card.innerHTML = `
    <div class="ai-badge" style="background:rgba(124,58,237,0.1);border-color:rgba(124,58,237,0.25);color:#a78bfa;">
      👁 Simulated Recruiter View
    </div>
    <p style="color:var(--muted);font-size:.88rem;margin-bottom:20px;">
      Here's what a recruiter experiences in their first 30 seconds on your profile:
    </p>
    <div class="recruiter-timeline">
      <div class="timeline-item">
        <div class="timeline-time">0-5s</div>
        <div class="timeline-dot"></div>
        <div class="timeline-text">
          Lands on profile. Sees avatar + <strong>${user.name || '⚠ No display name set'}</strong>.
          ${user.bio ? `Bio: <strong>"${escHtml(user.bio.substring(0,60))}${user.bio.length>60?'...':''}"</strong> — good first impression.` :
          `<strong style="color:var(--danger)">No bio found.</strong> Recruiter already unsure about your focus.`}
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-time">5-12s</div>
        <div class="timeline-dot"></div>
        <div class="timeline-text">
          Scans pinned repos or top repos. ${topRepo ?
          `Notices <strong>${escHtml(topRepo.name)}</strong> (${topRepo.stargazers_count}⭐). ${topRepo.description ? 'Description present — good.' : '<strong style="color:var(--danger)">No description!</strong> They may skip it.'}` :
          '<strong style="color:var(--danger)">No repositories to inspect.</strong>'}
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-time">12-20s</div>
        <div class="timeline-dot"></div>
        <div class="timeline-text">
          Checks languages used: <strong>${scores.languages.slice(0,3).join(', ') || 'None detected'}</strong>.
          ${scores.languages.length >= 3 ? 'Versatile developer signal.' : 'Limited tech exposure visible.'}
          ${noDesc > 0 ? `<strong style="color:var(--accent3)"> Notices ${noDesc} repos with no descriptions — concern flag.</strong>` : ''}
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-time">20-30s</div>
        <div class="timeline-dot"></div>
        <div class="timeline-text">
          ${hasReadme ?
          '<strong style="color:var(--accent)">Profile README found!</strong> This is a strong signal of a proactive developer.' :
          '<strong style="color:var(--accent3)">No profile README.</strong> Missed opportunity — a pinned README dramatically boosts first impressions.'}
          Decision: ${scores.total >= 70 ? '<strong style="color:var(--accent)">Likely to click into repos and consider reaching out.</strong>' :
          scores.total >= 50 ? '<strong style="color:var(--accent3)">May check one repo, uncertain about candidate.</strong>' :
          '<strong style="color:var(--danger)">Likely to move on without engaging further.</strong>'}
        </div>
      </div>
    </div>
  `;
}

// ── AI Analysis via Claude API ───────────────
async function streamAIAnalysis(user, repos, scores) {
  const analysisEl = document.getElementById('ai-analysis');
  analysisEl.innerHTML = '<span class="cursor"></span>';

  const repoSummary = repos.slice(0, 10).map(r =>
    `- ${r.name} (${r.language || 'unknown'}, ⭐${r.stargazers_count}): ${r.description || 'no description'}`
  ).join('\n');

  const prompt = `You are a senior tech recruiter and developer mentor. Analyze this GitHub profile for recruiter-readiness.

USER PROFILE:
- Username: ${user.login}
- Name: ${user.name || 'NOT SET'}
- Bio: ${user.bio || 'NOT SET'}
- Location: ${user.location || 'NOT SET'}
- Website: ${user.blog || 'NOT SET'}
- Followers: ${user.followers} | Following: ${user.following}
- Public Repos: ${user.public_repos}
- Account Created: ${new Date(user.created_at).toLocaleDateString()}

SCORES (out of 100): ${scores.total}/100 — ${scores.grade.label}
- Profile Completeness: ${scores.profile}/20
- Activity: ${scores.activity}/20
- Repository Quality: ${scores.repoQuality}/20
- Language Diversity: ${scores.languageDiversity}/20
- Community Impact: ${scores.communityImpact}/20

TOP REPOSITORIES:
${repoSummary}

Give a structured, honest, and specific analysis in this exact format using HTML:

<h3>🔍 Recruiter First Impression</h3>
<p>2-3 sentences about what a recruiter would immediately notice — be specific to THIS profile.</p>

<h3>💪 Your Strengths</h3>
<ul>
<li>Specific strength 1 based on actual data</li>
<li>Specific strength 2</li>
<li>Specific strength 3 (if applicable)</li>
</ul>

<h3>⚠️ Critical Issues to Fix</h3>
<ul>
<li>Most important issue with specific fix instruction</li>
<li>Second issue</li>
<li>Third issue</li>
</ul>

<h3>🚀 How to Reach ${scores.total >= 70 ? 90 : scores.total >= 50 ? 80 : 70}/100</h3>
<p>2-3 specific, actionable recommendations tailored to this profile to dramatically improve the score.</p>

Be direct, specific to the data, and helpful. Don't be generic. Mention actual repo names if relevant.`;

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'AI analysis failed');
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    await typeHTML(analysisEl, text);

  } catch (err) {
    // Fallback: rule-based analysis
    const fallback = generateFallbackAnalysis(user, repos, scores);
    await typeHTML(analysisEl, fallback);
  }
}

// Type HTML progressively
async function typeHTML(el, html) {
  el.innerHTML = '';
  // Parse into temp element and render in chunks
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const children = Array.from(temp.childNodes);

  for (const node of children) {
    const clone = node.cloneNode(true);
    el.appendChild(clone);
    await sleep(30);
  }
}

// Fallback if API unavailable
function generateFallbackAnalysis(user, repos, scores) {
  const topRepo = repos[0];
  const noDescCount = repos.filter(r => !r.description).length;

  return `
    <h3>🔍 Recruiter First Impression</h3>
    <p>${user.name ? `Strong start with display name "${user.name}" set.` : 'Missing display name — fix immediately.'} 
    ${user.bio ? `Bio present: "${escHtml(user.bio.substring(0,80))}..."` : 'No bio detected — this is the first thing recruiters look for.'} 
    Overall profile score of ${scores.total}/100 places you in the <strong>${scores.grade.label}</strong> tier.</p>

    <h3>💪 Your Strengths</h3>
    <ul>
      ${scores.languages.length > 0 ? `<li>Working with ${scores.languages.slice(0,4).join(', ')} — good technology coverage</li>` : ''}
      ${topRepo && topRepo.stargazers_count > 0 ? `<li><strong>${escHtml(topRepo.name)}</strong> has earned ${topRepo.stargazers_count} stars — shows real-world interest</li>` : ''}
      ${scores.activity >= 16 ? '<li>Recently active — consistent commits show dedication</li>' : ''}
      ${scores.profile >= 14 ? '<li>Profile is well-filled with key contact information</li>' : ''}
      ${repos.length >= 10 ? `<li>${repos.length} public repositories shows prolific building habit</li>` : ''}
    </ul>

    <h3>⚠️ Critical Issues to Fix</h3>
    <ul>
      ${!user.bio ? '<li><strong>Add a bio</strong> — write 1-2 sentences: your role, tech stack, and what you build</li>' : ''}
      ${!user.blog ? '<li><strong>Add a portfolio/LinkedIn URL</strong> to your profile — recruiters will click it</li>' : ''}
      ${noDescCount > 0 ? `<li><strong>${noDescCount} repos have no description</strong> — add 1-line descriptions to your top repos immediately</li>` : ''}
      ${scores.activity < 10 ? '<li><strong>Push code more regularly</strong> — your last activity was too long ago</li>' : ''}
      ${!repos.some(r => r.name.toLowerCase() === user.login.toLowerCase()) ? '<li><strong>Create a profile README</strong> — a pinned README.md in a repo named after your username is highly impactful</li>' : ''}
    </ul>

    <h3>🚀 How to Reach ${Math.min(scores.total + 25, 100)}/100</h3>
    <p>Focus on three things: (1) Fill all profile fields — bio, website, location, and name.
    (2) Add meaningful descriptions and README files to your top 5 repositories.
    (3) Pin your best 6 repositories so recruiters instantly see your best work without searching.
    These changes alone can raise your score by 20+ points.</p>
  `;
}

// ── Render: Next Steps ───────────────────────
function renderNextSteps(scores) {
  const list = document.getElementById('steps-list');
  const steps = [];

  if (scores.profile < 16) {
    steps.push({
      title: 'Complete Your Profile',
      desc: 'Add your full name, a compelling bio (what you build + your stack), your website/LinkedIn, and location.',
      priority: 'high'
    });
  }

  steps.push({
    title: 'Create a Profile README',
    desc: 'Create a repository named exactly as your GitHub username. Add a README.md with intro, skills, projects, and contact — this appears on your profile page.',
    priority: steps.length === 0 ? 'high' : 'mid'
  });

  if (scores.repoQuality < 15) {
    steps.push({
      title: 'Add Descriptions to Your Top Repos',
      desc: 'Every repository should have a 1-sentence description. Go to Settings on each repo and add it. Takes 2 minutes per repo.',
      priority: 'high'
    });
  }

  steps.push({
    title: 'Pin Your 6 Best Repositories',
    desc: 'Go to your GitHub profile → "Customize your pins" → select 6 repos that best showcase your skills. Recruiters see these first.',
    priority: 'mid'
  });

  if (scores.activity < 16) {
    steps.push({
      title: 'Make Commits Weekly',
      desc: 'Consistency matters. Set a goal: push at least 3-4 commits per week to any project. Even documentation updates count.',
      priority: 'mid'
    });
  }

  steps.push({
    title: 'Add README Files to Key Projects',
    desc: 'Each major repo needs: what it does, tech stack used, how to run it, and screenshots/demo link. This is what separates average profiles from exceptional ones.',
    priority: 'mid'
  });

  if (scores.languageDiversity < 15) {
    steps.push({
      title: 'Diversify Your Tech Portfolio',
      desc: 'Explore one new framework or language. Build a small project (todo app, API wrapper) — it signals learning mindset to recruiters.',
      priority: 'low'
    });
  }

  steps.push({
    title: 'Contribute to Open Source',
    desc: 'Even small contributions (fix typos, add docs) to popular repos signal collaboration skills. Use goodfirstissue.dev to find opportunities.',
    priority: 'low'
  });

  const priorityMap = { high: 'priority-high', mid: 'priority-mid', low: 'priority-low' };
  const priorityLabel = { high: 'Do Now', mid: 'This Week', low: 'This Month' };

  list.innerHTML = steps.slice(0, 7).map((step, i) => `
    <div class="step-item">
      <div class="step-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="step-content">
        <div class="step-title">${step.title}</div>
        <div class="step-desc">${step.desc}</div>
      </div>
      <div class="step-priority ${priorityMap[step.priority]}">${priorityLabel[step.priority]}</div>
    </div>
  `).join('');
}

// ── UI Helpers ───────────────────────────────
function showLoading() {
  heroSection.style.display = 'none';
  loadingEl.style.display = 'block';
  analyzeBtn.disabled = true;
  // Reset steps
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`step-${i}`)?.classList.remove('active');
  }
}

function hideLoading() {
  loadingEl.style.display = 'none';
  analyzeBtn.disabled = false;
}

function setLoadingStep(n) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step-${i}`);
    if (el) el.classList.toggle('active', i === n);
  }
}

function showResults() {
  resultsEl.style.display = 'block';
}

function showError(msg) {
  heroSection.style.display = 'block';
  errorBox.style.display = 'block';
  errorBox.textContent = '⚠ ' + msg;
}

function hideError() {
  errorBox.style.display = 'none';
  errorBox.textContent = '';
}

function resetUI() {
  resultsEl.style.display = 'none';
  heroSection.style.display = 'block';
  inputEl.value = '';
  inputEl.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function shakeInput() {
  inputEl.parentElement.style.animation = 'none';
  setTimeout(() => {
    inputEl.parentElement.style.animation = 'shake 0.3s ease';
  }, 10);
}

// ── Utilities ────────────────────────────────
function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n;
}

function daysAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function animateCounter(id, from, to, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── Shake animation ──────────────────────────
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }
`;
document.head.appendChild(style);
