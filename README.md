# ⚡ GitLens AI — GitHub Profile Analyzer

> **UnsaidTalks AICore Connect Hackathon 2026**  
> Built for the problem statement: Automated Campus Ambassador Management Platform (GitHub Profile Analyzer Track)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-00ff88?style=for-the-badge)](https://your-demo-link.netlify.app)
[![Tech](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS%20%7C%20Claude%20AI-7c3aed?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-38bdf8?style=for-the-badge)]()

---

## 🎯 What It Does

**GitLens AI** analyzes any public GitHub profile in under 2 minutes and gives students:

- ✅ **Recruiter-Readiness Score** (0–100) across 5 dimensions
- 👁️ **Simulated Recruiter View** — what happens in the first 30 seconds
- 🤖 **Claude AI Deep Analysis** — personalized, specific feedback
- 📦 **Repository Assessment** — which repos to improve or archive
- 🗺️ **Prioritized Action Plan** — exactly what to fix and in what order

---

## 🎥 Demo Video

> 📹 **[Watch the screen recording here](https://your-video-link.com)**  
> *(Replace this with your actual Loom / YouTube link)*

---

## 🚀 How to Run Locally

No build tools, no dependencies, no database. Pure HTML/CSS/JS.

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/gitlens-ai.git
cd gitlens-ai

# Option 1: Open directly in browser
open index.html

# Option 2: Use a local server (recommended)
npx serve .
# OR
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

---

## 🏗️ Architecture

```
gitlens-ai/
├── index.html       ← Single-page app (all UI)
├── app.js           ← Logic: GitHub API + Scoring + Claude AI
└── README.md        ← This file
```

**Zero backend required.** All computation happens client-side:

```
User enters username
      ↓
GitHub Public API (free, no key needed)
  - /users/{username}        → profile data
  - /users/{username}/repos  → repository list
      ↓
Scoring Engine (5 dimensions × 20 pts)
      ↓
Claude AI API (claude-sonnet-4)
  → Personalized analysis + feedback
      ↓
Rendered dashboard with actionable insights
```

---

## 📊 Scoring System

| Dimension | Max Score | What It Measures |
|---|---|---|
| 👤 Profile Completeness | 20 | Name, bio, website, location, email |
| ⚡ Recent Activity | 20 | Days since last GitHub activity |
| 📦 Repository Quality | 20 | Descriptions, stars, topics, non-empty repos |
| 🌐 Language Diversity | 20 | Number of programming languages used |
| 🌟 Community Impact | 20 | Followers, stars received, forks |

**Grade Scale:**
- 85-100 → Exceptional 🟢
- 70-84  → Strong 🔵
- 55-69  → Good 🟣
- 40-54  → Average 🟡
- 0-39   → Needs Work 🔴

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3 (CSS Variables, Grid, Flexbox) |
| Logic | Vanilla JavaScript (ES6+) |
| Data | GitHub Public REST API v3 |
| AI | Anthropic Claude (claude-sonnet-4) via API |
| Fonts | Google Fonts (Syne + Space Mono) |
| Hosting | Netlify / Vercel (static deploy) |

**No frameworks. No npm. No build step.**  
Opens directly in a browser.

---

## 💡 Key Features

### 1. Instant Score Dashboard
Five scoring categories with animated progress bars and a circular score gauge.

### 2. Recruiter Timeline Simulation
Shows exactly what a recruiter notices in 0–5s, 5–12s, 12–20s, and 20–30s — based on actual profile data.

### 3. AI-Powered Analysis (Claude)
Sends structured profile data to Claude AI and receives personalized, non-generic feedback including:
- Actual repo names mentioned
- Specific issues with fix instructions
- Target score roadmap

### 4. Repository Intelligence
Ranks and labels repos as High Impact / Notable / Starter. Flags repos without descriptions in red.

### 5. Prioritized Action Plan
Generates a ranked to-do list sorted as: Do Now → This Week → This Month.

---

## 🌐 Deployment (Netlify — 1 click)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir .
```

Or drag the folder to [netlify.com/drop](https://app.netlify.com/drop).

---

## 🔒 Privacy

- Only analyzes **public** GitHub data
- No data is stored
- GitHub username is not logged anywhere
- Claude AI receives anonymized profile summary only

---

## 📋 Evaluation Criteria Coverage

| Criteria | Weight | How We Address It |
|---|---|---|
| Impact | 20% | Full analysis in < 2 min; student walks away with clear actions |
| Innovation | 20% | AI-powered personalized feedback + Recruiter simulation view |
| Technical Execution | 20% | Clean modular JS, no deps, well-commented, quality README |
| User Experience | 25% | Dark themed, animated, responsive, zero-friction UX |
| Presentation | 15% | Screen recording in README |

---

## 👨‍💻 Author

Built with ❤️ for the **UnsaidTalks AICore Connect Hackathon 2026**

---

## 📜 License

MIT License — use freely, give credit.
