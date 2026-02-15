(() => {
  const $ = (id) => document.getElementById(id);

  const yearEl = $("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const state = {
    endpoint: null,
  };

  // THEME
  const themeBtn = $("themeBtn");
  const savedTheme = localStorage.getItem("cv_theme");
  if (savedTheme)
    document.documentElement.setAttribute("data-theme", savedTheme);

  themeBtn?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "" : "dark";
    if (next) document.documentElement.setAttribute("data-theme", next);
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("cv_theme", next || "");
  });

  // PDF
  $("pdfBtn")?.addEventListener("click", () => window.print());

  // Load JSON
  async function loadCV() {
    const res = await fetch("./data/cv.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Impossible de charger data/cv.json");
    const data = await res.json();

    // endpoint contact
    state.endpoint = data.contact?.discordWorkerEndpoint || null;

    // HERO
    $("cvName").textContent = data.hero.name;
    $("cvJob").textContent = data.hero.job;
    $("cvSubtitle").textContent = data.hero.subtitle;

    const tagsEl = $("cvTags");
    tagsEl.innerHTML = "";
    data.hero.tags.forEach((t) => {
      const s = document.createElement("span");
      s.className = "tag";
      s.textContent = t;
      tagsEl.appendChild(s);
    });

    $("cvLocation").textContent = data.hero.location;
    $("cvAvailability").textContent = data.hero.availability;
    $("cvDriving").textContent = data.hero.driving;

    const phoneA = $("cvPhone");
    phoneA.href = "tel:" + data.hero.phone.replace(/\s/g, "");
    phoneA.querySelector(".pillText").textContent = data.hero.phone;

    const emailA = $("cvEmail");
    emailA.href = "mailto:" + data.hero.email;
    emailA.querySelector(".pillText").textContent = data.hero.email;

    // PROFILE
    $("profileText").textContent = data.profile.text;

    // SKILLS
    const skillsBox = $("skillsBox");
    skillsBox.innerHTML = "";
    data.skills.forEach((s) => {
      const div = document.createElement("div");
      div.className = "kpi";
      div.innerHTML = `<strong>${escapeHtml(s.title)}</strong><span>${escapeHtml(s.text)}</span>`;
      skillsBox.appendChild(div);
    });

    // EXPERIENCE
    const expBox = $("experienceBox");
    expBox.innerHTML = "";
    data.experience.forEach((e) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="itemTop">
          <div>
            <div class="itemTitle">${escapeHtml(e.title)}</div>
            <div class="muted">${escapeHtml(e.city)}</div>
          </div>
          <div class="itemDate">${escapeHtml(e.date)}</div>
        </div>
        <ul class="list">${(e.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
      `;
      expBox.appendChild(div);
    });

    // EDUCATION
    const eduBox = $("educationBox");
    eduBox.innerHTML = "";
    data.education.forEach((e) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `
        <div class="itemTop">
          <div>
            <div class="itemTitle">${escapeHtml(e.title)}</div>
            <div class="muted">${escapeHtml(e.school)}</div>
          </div>
          <div class="itemDate">${escapeHtml(e.date)}</div>
        </div>
        <ul class="list">${(e.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
      `;
      eduBox.appendChild(div);
    });

    // STRENGTHS
    const strengthsBox = $("strengthsBox");
    strengthsBox.innerHTML = "";
    data.strengths.forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      strengthsBox.appendChild(li);
    });

    // INFOS
    $("mobilityInfo").textContent = data.infos.mobility;
    $("contractInfo").textContent = data.infos.contract;
    $("availabilityInfo").textContent = data.infos.availability;

    // PORTFOLIO
    // PORTFOLIO (images)
    
  }

  // CONTACT DISCORD
  const form = $("contactForm");
  const statusEl = $("status");
  const btn = $("sendBtn");
  const btnText = $("btnText");

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "status " + (type || "");
  }

  function setLoading(isLoading) {
    btn.disabled = isLoading;
    btn.classList.toggle("loading", isLoading);
    btnText.textContent = isLoading ? "Envoi..." : "Envoyer";
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", "");
    setLoading(true);

    const payload = {
      name: $("name").value.trim(),
      email: $("email").value.trim(),
      message: $("message").value.trim(),
      website: $("website").value.trim(), // honeypot
    };

    if (!payload.name || !payload.message) {
      setLoading(false);
      setStatus("Merci de remplir le nom et le message.", "err");
      return;
    }

    if (payload.website) {
      // bot
      setLoading(false);
      setStatus("✅ Message envoyé !", "ok");
      form.reset();
      return;
    }

    if (!state.endpoint) {
      setLoading(false);
      setStatus(
        "Endpoint Discord manquant (contact.discordWorkerEndpoint).",
        "err",
      );
      return;
    }

    try {
      const res = await fetch(state.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const txt = await res.text().catch(() => "");
      if (!res.ok) {
        setLoading(false);
        setStatus("Erreur : " + (txt || res.status), "err");
        return;
      }

      setLoading(false);
      setStatus("✅ Message envoyé !", "ok");
      form.reset();
    } catch {
      setLoading(false);
      setStatus("Erreur réseau.", "err");
    }
  });

  // Helpers
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // init
  loadCV().catch((err) => {
    console.error(err);
    const fallback = document.createElement("div");
    fallback.style.margin = "16px 0";
    fallback.className = "muted";
    fallback.textContent =
      "Erreur: impossible de charger data/cv.json (vérifie le chemin).";
    document.querySelector("main.wrap")?.prepend(fallback);
  });
})();
