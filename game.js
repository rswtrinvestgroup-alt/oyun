/**
 * SIWIWORLD Akademi - Pazarlama Stratejileri At Yarışı
 */

const STORAGE_KEY = "siwiworld_race_data";

const STRATEGIES = {
  meta: { id: "meta", name: "Meta Ads Fırtınası", icon: "⚡", horse: "🐎" },
  seo: { id: "seo", name: "SEO Çınarı", icon: "🌲", horse: "🐴" },
  influencer: { id: "influencer", name: "Influencer Rüzgarı", icon: "🎲", horse: "🏇" },
  email: { id: "email", name: "E-Mail Marketing Asili", icon: "📧", horse: "🦄" },
};

const JOKERS = {
  budget: { id: "budget", name: "Bütçe Canavarı", letter: "A" },
  crisis: { id: "crisis", name: "Kriz Yönetimi", letter: "B" },
  organic: { id: "organic", name: "Organik Büyüme", letter: "C" },
};

const SYNERGY_HINTS = {
  "seo-organic": "Mükemmel uyum! SEO + Organik Büyüme son düzlükte çok güçlü.",
  "meta-budget": "Güçlü uyum! Meta Ads + Bütçe Canavarı agresif bir çıkış yapar.",
  "meta-crisis": "Meta enerji düşüşüne karşı Kriz Yönetimi koruma sağlar.",
  "email-crisis": "İstikrarlı e-posta stratejisi kriz jokeriyle daha da dengeli.",
  "influencer-budget": "Viral patlamalar bütçe desteğiyle daha sık tetiklenebilir.",
};

const state = {
  user: { name: "", phone: "", email: "" },
  strategy: null,
  joker: null,
  racing: false,
};

let raceAnimId = null;
let raceHorses = [];

/* --- DOM --- */
const screens = {
  blocked: document.getElementById("screen-blocked"),
  welcome: document.getElementById("screen-welcome"),
  strategy: document.getElementById("screen-strategy"),
  joker: document.getElementById("screen-joker"),
  race: document.getElementById("screen-race"),
  result: document.getElementById("screen-result"),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => {
    el.classList.remove("active");
    el.classList.add("hidden");
  });
  const target = screens[name];
  if (target) {
    target.classList.remove("hidden");
    target.classList.add("active");
  }
}

/* --- LocalStorage --- */
function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUserProfile() {
  if (!state.user?.name) return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ user: state.user, hasRaced: false })
  );
}

function saveRaceResult(place, code, standings) {
  const data = {
    hasRaced: true,
    user: state.user,
    strategy: state.strategy,
    joker: state.joker,
    place,
    code,
    standings,
    date: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function fillRegistrationForm(user) {
  if (!user) return;
  document.getElementById("input-name").value = user.name || "";
  document.getElementById("input-phone").value = user.phone || "";
  document.getElementById("input-email").value = user.email || "";
}

function getResultContent(place) {
  if (place === 1) {
    return {
      code: "SIWI30",
      title: "Şampiyon Pazarlamacı!",
      medal: "🏆",
      message:
        "Muazzam bir strateji uyumu! Seçtiğin at yarışı 1. bitirdi. Hak ettiğin %30 Elite İndirim Kodun aşağıda. Formdaki bilgileriniz alındı, eğitim danışmanlarımız sizinle iletişime geçecektir!",
    };
  }
  if (place === 2 || place === 3) {
    return {
      code: "SIWI20",
      title: "Potansiyeli Yüksek Stratejist",
      medal: "🥈",
      message:
        "Güzel yarıştı ama liderliği kıl payı kaçırdı! Yine de stratejin güçlüydü. %20 Başarı İndirim Kodun aşağıda.",
    };
  }
  return {
    code: "SIWI10",
    title: "Gelişmekte Olan Stratejist",
    medal: "📈",
    message:
      "Stratejin bu yarışta geride kaldı ama pes etmek yok! Pazarlamada kaybetmek de bir tecrübedir. Eğitimlerimizde kendini geliştirmen için %10 Teselli İndirim Kodun aşağıda.",
  };
}

function initFromStorage() {
  const saved = loadSaved();
  if (!saved) return false;

  if (saved.user) {
    state.user = saved.user;
    fillRegistrationForm(saved.user);
  }

  if (!saved.hasRaced) return false;

  if (saved.standings?.length) {
    const { title, medal, message, code } = getResultContent(saved.place);
    showResults(title, medal, message, code, saved.standings);
  } else {
    document.getElementById("blocked-discount").textContent =
      saved.code ? `Kodun: ${saved.code}` : "";
    document.getElementById("blocked-user").textContent = saved.user?.name
      ? `Kayıtlı: ${saved.user.name} — ${saved.user.email}`
      : "";
    showScreen("blocked");
  }
  return true;
}

function resetRaceSelections() {
  state.strategy = null;
  state.joker = null;
  state.racing = false;
  raceHorses = [];

  document.querySelectorAll(".strategy-card, .joker-card").forEach((c) => {
    c.classList.remove("selected");
    c.setAttribute("aria-pressed", "false");
  });
  document.getElementById("btn-to-joker").disabled = true;
  document.getElementById("btn-to-race").disabled = true;
  document.getElementById("synergy-hint").classList.add("hidden");

  const startBtn = document.getElementById("btn-start-race");
  startBtn.disabled = false;
  document.getElementById("race-status").textContent = "Hazır olduğunda yarışı başlat.";
  document.getElementById("race-lanes").innerHTML = "";
  document.getElementById("confetti-container").innerHTML = "";
}

/** Kayıt bilgilerini korur; yalnızca yeni yarış için strateji seçimine döner */
function resetGame() {
  const saved = loadSaved();
  const user =
    state.user?.name ? state.user : saved?.user;

  if (!user?.name) {
    showScreen("welcome");
    return;
  }

  if (raceAnimId) {
    cancelAnimationFrame(raceAnimId);
    raceAnimId = null;
  }

  state.user = user;
  fillRegistrationForm(user);
  saveUserProfile();
  resetRaceSelections();
  showScreen("strategy");
}

/* --- Form --- */
document.getElementById("form-register").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("input-name").value.trim();
  const phone = document.getElementById("input-phone").value.trim();
  const email = document.getElementById("input-email").value.trim();
  const errEl = document.getElementById("form-error");

  if (!name || !phone || !email) {
    errEl.textContent = "Lütfen tüm alanları doldurun.";
    errEl.classList.remove("hidden");
    return;
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    errEl.textContent = "Geçerli bir e-posta adresi girin.";
    errEl.classList.remove("hidden");
    return;
  }

  errEl.classList.add("hidden");
  state.user = { name, phone, email };
  saveUserProfile();
  resetRaceSelections();
  showScreen("strategy");
});

document.getElementById("btn-back-welcome").addEventListener("click", () => showScreen("welcome"));

/* --- Strategy selection --- */
document.querySelectorAll(".strategy-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".strategy-card").forEach((c) => {
      c.classList.remove("selected");
      c.setAttribute("aria-pressed", "false");
    });
    card.classList.add("selected");
    card.setAttribute("aria-pressed", "true");
    state.strategy = card.dataset.strategy;
    document.getElementById("btn-to-joker").disabled = false;
  });
});

document.getElementById("btn-to-joker").addEventListener("click", () => {
  if (!state.strategy) return;
  showScreen("joker");
  updateSynergyHint();
});

document.getElementById("btn-back-strategy").addEventListener("click", () => showScreen("strategy"));

/* --- Joker selection --- */
document.querySelectorAll(".joker-card").forEach((card) => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".joker-card").forEach((c) => {
      c.classList.remove("selected");
      c.setAttribute("aria-pressed", "false");
    });
    card.classList.add("selected");
    card.setAttribute("aria-pressed", "true");
    state.joker = card.dataset.joker;
    document.getElementById("btn-to-race").disabled = false;
    updateSynergyHint();
  });
});

function updateSynergyHint() {
  const hint = document.getElementById("synergy-hint");
  if (!state.strategy || !state.joker) {
    hint.classList.add("hidden");
    return;
  }
  const key = `${state.strategy}-${state.joker}`;
  const text = SYNERGY_HINTS[key];
  if (text) {
    hint.textContent = "💡 " + text;
    hint.classList.remove("hidden");
  } else {
    hint.textContent = "Seçimlerin dengeli; joker her stratejide farklı etki gösterir.";
    hint.classList.remove("hidden");
  }
}

document.getElementById("btn-to-race").addEventListener("click", () => {
  if (!state.strategy || !state.joker) return;
  buildRaceLanes();
  const s = STRATEGIES[state.strategy];
  const j = JOKERS[state.joker];
  document.getElementById("race-selection-summary").textContent =
    `Senin atın: ${s.name} · Joker: ${j.name}`;
  showScreen("race");
});

/* --- Race speed algorithm (orta zorluk) --- */
function getProgressFactor(strategyId, progress, isPlayer, joker) {
  const p = progress;
  let speed = 1;

  switch (strategyId) {
    case "meta":
      if (p < 0.25) speed = 1.45;
      else if (p < 0.55) speed = isPlayer && joker === "crisis" ? 1.15 : 0.75;
      else speed = 1.05;
      break;
    case "seo":
      if (p < 0.35) speed = 0.65;
      else if (p < 0.65) speed = 0.95;
      else speed = 1.55;
      break;
    case "influencer":
      speed = 0.9 + Math.sin(p * 12 + (isPlayer ? 1 : 0)) * 0.35 + (Math.random() - 0.5) * 0.2;
      break;
    case "email":
      speed = 1.08;
      break;
    default:
      speed = 1;
  }

  if (isPlayer && joker) {
    if (joker === "budget" && p < 0.3) speed *= 1.15;
    if (joker === "organic" && p > 0.72) speed *= 1.2;
    if (joker === "crisis" && strategyId === "meta" && p >= 0.25 && p < 0.55) speed = Math.max(speed, 1.12);
  }

  return speed;
}

function getSynergyBonus(strategyId, joker) {
  const key = `${strategyId}-${joker}`;
  const bonuses = {
    "seo-organic": 0.18,
    "meta-budget": 0.12,
    "meta-crisis": 0.1,
    "email-crisis": 0.08,
    "influencer-budget": 0.1,
  };
  return bonuses[key] || 0.04;
}

function buildRaceLanes() {
  const container = document.getElementById("race-lanes");
  container.innerHTML = "";
  const order = ["meta", "seo", "influencer", "email"];

  raceHorses = order.map((id) => ({
    id,
    name: STRATEGIES[id].name,
    icon: STRATEGIES[id].horse,
    progress: 0,
    isPlayer: id === state.strategy,
    finished: false,
    finishTime: null,
  }));

  raceHorses.forEach((horse) => {
    const lane = document.createElement("div");
    lane.className = "lane" + (horse.isPlayer ? " player-lane" : "");
    lane.dataset.horseId = horse.id;
    lane.innerHTML = `
      <span class="lane-label">${horse.isPlayer ? "★ " : ""}${horse.name}</span>
      <span class="runner" role="img" aria-label="${horse.name}">${horse.icon}</span>
      <span class="lane-dust"></span>
    `;
    container.appendChild(lane);
  });
}

function updateRunnerPosition(horseId, progress) {
  const lane = document.querySelector(`.lane[data-horse-id="${horseId}"]`);
  if (!lane) return;
  const runner = lane.querySelector(".runner");
  /* Sol → sağ (finiş çizgisi); sadece left ile konum, animasyon transform'u bozmasın */
  const maxPct = 78;
  const x = (progress / 100) * maxPct;
  runner.style.left = `${x}%`;
}

document.getElementById("btn-start-race").addEventListener("click", startRace);

function startRace() {
  if (state.racing) return;
  state.racing = true;

  const btn = document.getElementById("btn-start-race");
  const status = document.getElementById("race-status");
  btn.disabled = true;
  status.textContent = "Yarış devam ediyor…";

  document.querySelectorAll(".lane").forEach((l) => l.classList.add("racing"));
  document.querySelectorAll(".runner").forEach((r) => r.classList.add("racing"));

  const duration = 11000 + Math.random() * 4000;
  const startTime = performance.now();
  const synergy = getSynergyBonus(state.strategy, state.joker);
  let finishOrder = [];
  const finishLine = 100;

  function tick(now) {
    const elapsed = now - startTime;
    const globalProgress = Math.min(elapsed / duration, 1);

    raceHorses.forEach((horse) => {
      if (horse.finished) return;

      const progressNorm = horse.progress / 100;
      let speed = getProgressFactor(
        horse.id,
        progressNorm,
        horse.isPlayer,
        horse.isPlayer ? state.joker : null
      );

      if (horse.isPlayer) {
        speed *= 1 + synergy;
        if (globalProgress > 0.7 && state.joker === "organic" && horse.id === "seo") {
          speed *= 1.08;
        }
      } else {
        speed *= 0.92 + Math.random() * 0.08;
      }

      const delta = speed * (100 / (duration / 16)) * 0.85;
      horse.progress = Math.min(horse.progress + delta, finishLine);
      updateRunnerPosition(horse.id, horse.progress);

      if (horse.progress >= finishLine && !horse.finished) {
        horse.finished = true;
        horse.finishTime = elapsed;
        finishOrder.push(horse);
        if (finishOrder.length === 1) {
          status.textContent = `${horse.name} finiş çizgisini ilk geçti!`;
        }
      }
    });

    if (finishOrder.length < raceHorses.length && elapsed < duration + 5000) {
      raceAnimId = requestAnimationFrame(tick);
    } else {
      raceHorses
        .filter((h) => !h.finished)
        .sort((a, b) => b.progress - a.progress)
        .forEach((h) => {
          h.finished = true;
          h.progress = 100;
          updateRunnerPosition(h.id, 100);
          finishOrder.push(h);
        });
      endRace(finishOrder);
    }
  }

  raceAnimId = requestAnimationFrame(tick);
}

function endRace(finishOrder) {
  state.racing = false;
  if (raceAnimId) cancelAnimationFrame(raceAnimId);

  document.querySelectorAll(".lane").forEach((l) => l.classList.remove("racing"));

  const place = finishOrder.findIndex((h) => h.isPlayer) + 1;
  const { code, title, medal, message } = getResultContent(place);

  const standings = finishOrder.map((h, i) => ({
    place: i + 1,
    name: h.name,
    isPlayer: h.isPlayer,
  }));

  saveRaceResult(place, code, standings);
  showResults(title, medal, message, code, standings);
  launchConfetti();
}

function showResults(title, medal, message, code, standings) {
  document.getElementById("result-title").textContent = title;
  document.getElementById("result-medal").textContent = medal;
  document.getElementById("result-message").textContent = message;
  document.getElementById("result-code").textContent = code;

  const list = document.getElementById("result-standings");
  list.innerHTML = "<h3>Yarış Sıralaması</h3>";
  standings.forEach((row) => {
    const div = document.createElement("div");
    div.className = "standing-row" + (row.isPlayer ? " you" : "");
    div.innerHTML = `
      <span class="standing-pos">${row.place}.</span>
      <span>${row.name}${row.isPlayer ? " (Sen)" : ""}</span>
    `;
    list.appendChild(div);
  });

  showScreen("result");
}

document.querySelectorAll(".btn-restart").forEach((btn) => {
  btn.addEventListener("click", resetGame);
});

document.getElementById("btn-copy-code").addEventListener("click", () => {
  const code = document.getElementById("result-code").textContent;
  navigator.clipboard?.writeText(code).then(() => {
    const btn = document.getElementById("btn-copy-code");
    btn.textContent = "Kopyalandı!";
    setTimeout(() => { btn.textContent = "Kopyala"; }, 2000);
  });
});

/* --- Confetti --- */
function launchConfetti() {
  const container = document.getElementById("confetti-container");
  container.innerHTML = "";
  const colors = ["#f59e0b", "#38bdf8", "#34d399", "#f472b6", "#a78bfa", "#fff"];

  for (let i = 0; i < 80; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = 2 + Math.random() * 2 + "s";
    piece.style.animationDelay = Math.random() * 0.8 + "s";
    piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    piece.style.width = 6 + Math.random() * 8 + "px";
    piece.style.height = piece.style.width;
    container.appendChild(piece);
  }

  setTimeout(() => { container.innerHTML = ""; }, 5000);
}

/* --- Init --- */
if (!initFromStorage()) {
  showScreen("welcome");
}
