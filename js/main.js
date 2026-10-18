// =====================================================
// MAIN.JS – FINAL CLEANED & FIXED VERSION
// =====================================================

import { firebaseGet, hashPass } from "../src/services/firebaseService.js";
import { DATA_MODE } from "../src/config.js";

const DB_ROOT = "content";
const ADMIN_URL = "./admin/admin.html";

let ALL_PEOPLE = [];
window.ALL_PEOPLE = [];

// =====================================================
// DOM READY
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
  if (DATA_MODE === "firebase") {
    await loadHeadBackground();
    await loadAvatars();
    await loadInfoSection();
    initAdminLock();
    ALL_PEOPLE = await loadPeople();
    window.ALL_PEOPLE = ALL_PEOPLE;
    initPersonInfoPanel();
  }

  initUI();
  initFamilyBook();
});

// =====================================================
// HEADER BACKGROUND
// =====================================================
async function loadHeadBackground() {
  const data = await firebaseGet(`${DB_ROOT}/headBg`);
  if (!data) return;
  const images = Object.values(data)
    .map(i => i.image)
    .filter(i => i?.startsWith("http") || i?.startsWith("data:image"));
  if (!images.length) return;
  const header = document.getElementById("site-header");
  let i = 0;
  if (header) {
    header.style.setProperty("--header-bg", `url("${images[0]}")`);

    if (images.length > 1) {
      setInterval(() => {
        i = (i + 1) % images.length;
        header.style.setProperty("--header-bg", `url("${images[i]}")`);
      }, 10000);
    }
  }
}

// =====================================================
// LOAD AVATAR – TRƯỞNG HỌ + CÁC CHI
// =====================================================
async function loadAvatars() {
  const data = await firebaseGet(`${DB_ROOT}/truong`);
  if (!data) return;

  Object.values(data).forEach(item => {
    if (!item.anh || !item.chiName) return;

    if (item.chiName === "Trương Văn") {
      const img = document.getElementById("img-chief");
      if (img) img.src = item.anh;
      return;
    }

    document.querySelectorAll(".branch").forEach(branch => {
      if (branch.dataset.chi === item.chiName) {
        const img = branch.querySelector("img");
        if (img) img.src = item.anh;
      }
    });
  });
}

// =====================================================
// ADMIN
// =====================================================
function initAdminLock() {
  const lock = document.getElementById("admin-lock");
  if (!lock) return;

  lock.addEventListener("click", async () => {
    const pass = prompt("Nhập mật khẩu admin:");
    if (!pass) return;

    const ok = await checkAdminPassword(pass);
    if (ok) window.location.href = ADMIN_URL;
    else alert("❌ Sai mật khẩu!");
  });
}

async function checkAdminPassword(pass) {
  const data = await firebaseGet("config/password");
  if (!data) return false;
  const hash = await hashPass(pass.trim());
  return Object.values(data).some(h => h === hash);
}

// =====================================================
// PEOPLE
// =====================================================
async function loadPeople() {
  const raw = await firebaseGet("people");
  if (!raw) return [];

  return Object.entries(raw).map(([id, p]) => ({
    id,
    data: p,
    name: p.hovaten || "",
    avatar: p.anh || "",
    birth: p.sinh || "",
    fatherId: p.cha || null,
    branch: p.chinhap || ""
  }));
}

// =====================================================
// TREE – 3 GENERATION ONLY
// =====================================================

const IS_MOBILE = window.innerWidth <= 768;
const MOBILE_COL_X = {
  0: 40,
  1: 260,
  2: 480
};

let activeTooltipPersonId = null;
const CHILD_GAP_DESKTOP = 8;
const CHILD_GAP_MOBILE = 6;
const NODE_W = 200;
const NODE_H = IS_MOBILE ? 48 : 55;
const nameY = IS_MOBILE ? 22 : 30;
const metaY = IS_MOBILE ? 36 : 46;

function render3GenTree(centerPerson) {
  const svg = document.getElementById("genealogy-svg");
  if (!svg || !centerPerson) return;
  svg.innerHTML = "";
  const map = new Map(ALL_PEOPLE.map(p => [p.id, p]));
  const father = centerPerson.fatherId ? map.get(centerPerson.fatherId) : null;
  const children = ALL_PEOPLE.filter(p => p.fatherId === centerPerson.id);
  const nodes = [];
  if (father && father.id) {
    nodes.push({ ...father, _level: 0 });
  }

  nodes.push({ ...centerPerson, _level: 1 });
  children.forEach(c => nodes.push({ ...c, _level: 2 }));

  const GAP_Y = 90;
  const levelGroups = {
    0: nodes.filter(n => n._level === 0),
    1: nodes.filter(n => n._level === 1),
    2: nodes.filter(n => n._level === 2)
  };

  const pos = {};

  Object.entries(levelGroups).forEach(([level, list]) => {
    if (level != 2) return;
    if (!list || list.length === 0) return;
    if (IS_MOBILE) {
      let startY = 40;
      list.forEach((n, i) => {
        pos[n.id] = {
          x: MOBILE_COL_X[2],
          y: startY + i * (NODE_H + CHILD_GAP_MOBILE)
        };
      });

      const firstY = pos[list[0].id].y;
      const lastY = pos[list[list.length - 1].id].y + NODE_H;
      window.__treeCenterY = firstY + (lastY - firstY) / 2 - NODE_H / 2;

    } else {
      const y = 40 + 2 * GAP_Y;
      const parentId = list[0].fatherId;
      const parentX = pos[parentId]?.x || 40;

      const totalWidth = list.length * NODE_W + (list.length - 1) * CHILD_GAP_DESKTOP;
      let startX = parentX + NODE_W / 2 - totalWidth / 2;

      list.forEach((n, i) => {
        pos[n.id] = {
          x: startX + i * (NODE_W + CHILD_GAP_DESKTOP),
          y
        };
      });
      const firstX = pos[list[0].id].x;
      const lastX = pos[list[list.length - 1].id].x + NODE_W;
      window.__treeCenterX = firstX + (lastX - firstX) / 2 - NODE_W / 2;
    }
  });

  if (IS_MOBILE && window.__treeCenterY == null) window.__treeCenterY = 40;
  if (!IS_MOBILE && window.__treeCenterX == null) window.__treeCenterX = 40;

  Object.entries(levelGroups).forEach(([level, list]) => {
    if (level == 2) return;

    if (IS_MOBILE) {
      list.forEach(n => {
        pos[n.id] = {
          x: MOBILE_COL_X[level],
          y: window.__treeCenterY
        };
      });
    } else {
      const y = 40 + level * GAP_Y;
      list.forEach(n => {
        pos[n.id] = {
          x: window.__treeCenterX,
          y
        };
      });
    }
  });

  showTree();


  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  Object.values(pos).forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x + NODE_W);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y + NODE_H);
  });

  const PAD_X = 40, PAD_Y = 30;
  const width = maxX - minX + PAD_X * 2;
  const height = maxY - minY + PAD_Y * 2;

  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `${minX - PAD_X} ${minY - PAD_Y} ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  svg.style.display = "block";
  svg.style.marginLeft = "auto";
  svg.style.marginRight = "auto";

  if (IS_MOBILE) {
    svg.style.width = "100%";
    svg.style.height = "calc(100vh - 140px)";
    svg.style.maxWidth = "100%";
    svg.style.maxHeight = "100%";
  }

  nodes.forEach(n => {
    if (!n || !n.id) return;

    if (n.fatherId && pos[n.fatherId] && pos[n.id]) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      if (IS_MOBILE) {
        line.setAttribute("x1", pos[n.fatherId].x + NODE_W);
        line.setAttribute("y1", pos[n.fatherId].y + NODE_H / 2);
        line.setAttribute("x2", pos[n.id].x);
        line.setAttribute("y2", pos[n.id].y + NODE_H / 2);
        line.setAttribute("stroke", "#999");
        line.setAttribute("stroke-width", "1.2");
      } else {
        line.setAttribute("x1", pos[n.fatherId].x + NODE_W / 2);
        line.setAttribute("y1", pos[n.fatherId].y + NODE_H);
        line.setAttribute("x2", pos[n.id].x + NODE_W / 2);
        line.setAttribute("y2", pos[n.id].y);
        line.setAttribute("stroke", "#999");
        line.setAttribute("stroke-width", "1.2");
      }
      svg.appendChild(line);
    }
  });

  const tooltip = document.getElementById("tooltip");

  nodes.forEach(p => {
    if (!pos[p.id]) return;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${pos[p.id].x},${pos[p.id].y})`);
    g.style.cursor = "pointer";

    const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    r.setAttribute("width", NODE_W);
    r.setAttribute("height", NODE_H);
    r.setAttribute("rx", 8);
    r.setAttribute("fill", "#fff");
    r.setAttribute("stroke", p.id === centerPerson.id ? "#c0392b" : "#333");
    r.setAttribute("stroke-width", p.id === centerPerson.id ? "2" : "1");

    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttribute("x", 6);
    img.setAttribute("y", 6);
    img.setAttribute("width", 44);
    img.setAttribute("height", 44);
    img.setAttribute("href", p.avatar || "https://via.placeholder.com/44");

    const name = document.createElementNS("http://www.w3.org/2000/svg", "text");
    name.setAttribute("x", 56);
    name.setAttribute("y", nameY);
    name.setAttribute("font-size", "13");
    name.setAttribute("font-weight", "600");
    name.textContent = p.name || "Không tên";

    const doi = (p.doinhap ?? p.data?.doinhap ?? (p._level + 1));
    const meta = document.createElementNS("http://www.w3.org/2000/svg", "text");
    meta.setAttribute("x", 56);
    meta.setAttribute("y", metaY);
    meta.setAttribute("font-size", "11");
    meta.setAttribute("fill", "#666");
meta.textContent = `${p.birth || "Chưa rõ"} – Đời ${doi}`;

    g.append(r, img, name, meta);
    svg.appendChild(g);

    const renderTooltipHTML = () => `
      <strong>${p.name || "Không tên"}</strong><br>
      Sinh: ${p.birth || "Chưa rõ"}<br>
      Đời: ${doi}<br>
      Chi: ${p.branch || "?"}
    `;

    if (!IS_MOBILE && tooltip) {
      g.addEventListener("mouseenter", () => {
        tooltip.innerHTML = renderTooltipHTML();
        tooltip.style.display = "block";
      });

      g.addEventListener("mousemove", e => {
        tooltip.style.left = e.pageX + 15 + "px";
        tooltip.style.top = e.pageY + 15 + "px";
      });

      g.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });
    }

    g.addEventListener("click", e => {
      if (IS_MOBILE) {
        e.preventDefault();
        e.stopPropagation();

        if (activeTooltipPersonId === p.id) {
          activeTooltipPersonId = null;
          if (tooltip) tooltip.style.display = "none";

          showTree();
          showInfo();
          showPersonInfo(p);
          render3GenTree(p);
          return;
        }

        activeTooltipPersonId = p.id;
        if (tooltip) {
          tooltip.innerHTML = renderTooltipHTML();
          tooltip.style.display = "block";
          tooltip.style.left = e.pageX + "px";
          tooltip.style.top = e.pageY + "px";
        }
        return;
      }

      showTree();
      showInfo();
      showPersonInfo(p);
      render3GenTree(p);
    });
  });
}

// =====================================================
// UI + ZOOM + CHI BRANCH
// =====================================================
function initUI() {
  const zoom = document.getElementById("zoomRange");
  if (zoom) {
    zoom.addEventListener("input", e => {
      const scale = e.target.value / 100;
      const svg = document.getElementById("genealogy-svg");
      if (svg) svg.style.transform = `scale(${scale})`;
    });
  }

  document.querySelectorAll(".branch").forEach(b => {
    b.addEventListener("click", () => {
      showTree();
      renderChiDoiList(b.dataset.chi);
    });
  });

  const chief = document.getElementById("img-chief");
  if (chief) {
    chief.onclick = () => {
      showTree();
      renderChiDoiList("Trương Văn");
    };
  }
}

// =====================================================
// INFO PANEL
// =====================================================
function initPersonInfoPanel() {
  const selChi = document.getElementById("chi");
  const selDoi = document.getElementById("doi");
  const selTen = document.getElementById("ten");
  const btn = document.getElementById("btn-search");
  if (!selChi || !selDoi || !selTen || !btn || !ALL_PEOPLE.length) return;

  selChi.innerHTML = `<option value="">Chọn chi</option>`;
  selDoi.innerHTML = `<option value="">Chọn đời</option>`;
  selTen.innerHTML = `<option value="">Chọn tên</option>`;

  const chiList = [...new Set(ALL_PEOPLE.map(p => p.data?.chinhap).filter(v => v))];
  chiList.forEach(chi => selChi.innerHTML += `<option value="${chi}">${chi}</option>`);

  selChi.onchange = () => {
    selDoi.innerHTML = `<option value="">Chọn đời</option>`;
    selTen.innerHTML = `<option value="">Chọn tên</option>`;
    if (!selChi.value) return;

    const doiList = [...new Set(
      ALL_PEOPLE
        .filter(p => p.data?.chinhap === selChi.value)
        .map(p => Number(p.data?.doinhap))
        .filter(n => Number.isFinite(n))
    )].sort((a, b) => a - b);

    doiList.forEach(d => selDoi.innerHTML += `<option value="${d}">Đời ${d}</option>`);
  };

  selDoi.onchange = () => {
    selTen.innerHTML = `<option value="">Chọn tên</option>`;
    if (!selDoi.value) return;
    const doiVal = Number(selDoi.value);

    ALL_PEOPLE
      .filter(p => p.data?.chinhap === selChi.value && Number(p.data?.doinhap) === doiVal)
      .forEach(p => selTen.innerHTML += `<option value="${p.id}">${p.data?.hovaten || "(không tên)"}</option>`);
  };

  btn.onclick = () => {
    const id = selTen.value;
    if (!id) return;
    const p = ALL_PEOPLE.find(x => x.id === id);
    if (!p) return;
    showTree();
    showInfo();
    showPersonInfo(p);
    render3GenTree(p);
  };
}

// =====================================================
// HELPERS
// =====================================================
function getNameById(id) {
  if (!id) return "";
  const p = ALL_PEOPLE.find(x => x.id === id);
  return p?.data?.hovaten || "";
}

function renderChiDoiList(chi) {
  const wrap = document.getElementById("tree-wrapper");
  const svg = document.getElementById("genealogy-svg");
  if (!wrap) return;

  if (svg) svg.style.display = "none";

  let listBox = document.getElementById("genealogy-list");
  if (!listBox) {
    listBox = document.createElement("div");
    listBox.id = "genealogy-list";
    listBox.className = "genealogy-list";
    wrap.appendChild(listBox);
  }

  const people = ALL_PEOPLE.filter(p => p.data?.chinhap === chi);

  const doiMap = {};
  people.forEach(p => {
    const d = Number(p.data?.doinhap);
    if (!Number.isFinite(d)) return;
    if (!doiMap[d]) doiMap[d] = [];
    doiMap[d].push(p);
  });

  const doiList = Object.keys(doiMap).map(Number).sort((a, b) => a - b);

  listBox.innerHTML = `
    <div class="chi-title">${chi}</div>${doiList.map(d => `
      <div class="doi-block" data-doi="${d}">
        <div class="doi-title clickable">Đời ${d}</div>
        <ul class="doi-names" style="display:none">
          ${doiMap[d]
            .sort((a,b) => (a.name || "").localeCompare(b.name || ""))
            .map(p => `
              <li class="person-item" data-id="${p.id}">
                ${p.name || "(không tên)"}
              </li>
            `).join("")}
        </ul>
      </div>
    `).join("")}
  `;

  listBox.querySelectorAll(".doi-title").forEach(title => {
    title.onclick = () => {
      const ul = title.nextElementSibling;
      if (!ul) return;

      listBox.querySelectorAll(".doi-names").forEach(x => {
        if (x !== ul) x.style.display = "none";
      });

      ul.style.display = ul.style.display === "none" ? "block" : "none";
    };
  });

  listBox.querySelectorAll(".person-item").forEach(li => {
    li.onclick = () => {
      const id = li.dataset.id;
      const p = ALL_PEOPLE.find(x => x.id === id);
      if (!p) return;

      listBox.style.display = "none";
      if (svg) svg.style.display = "block";

      showTree();
      showInfo();
      showPersonInfo(p);
      render3GenTree(p);
    };
  });

  listBox.style.display = "block";
  showTree();
}

// =====================================================
// SHOW INFO / TREE
// =====================================================
function showPersonInfo(p) {
  const d = p.data;
  const infoBox = document.getElementById("person-info");
  const spouseBox = document.getElementById("person-spouse");
  if (!infoBox || !spouseBox || !d) return;

  infoBox.innerHTML = "";
  spouseBox.innerHTML = "";
  const row = (label, value) => value ? `<div class="info-row"><span class="info-label">${label}</span><span class="info-value">${value}</span></div>` : "";
  const mapBtn = url => url ? `<a href="${url}" target="_blank">[tìm mộ]</a>` : `[chưa có link]`;

  infoBox.innerHTML = `
    <div class="info-card">
      ${d.anh ? `<img class="info-avatar" src="${d.anh}">` : ""}
      ${row("Họ và tên", d.hovaten)}
      ${row("Thường gọi", d.thuonggoi)}
      ${row("Chi", d.chinhap)}
      ${row("Đời thứ", d.doinhap)}
      ${row("Cha", getNameById(d.cha))}
      ${row("Mẹ", d.me)}
      ${row("Chức nghiệp", d.nghiep)}
      ${row("Sinh", d.sinh)}
      ${row("Mất (Giỗ)", d.mat)}
      ${row("Mộ táng", d.motang)}
      ${row("Vị trí Maps", mapBtn(d.map))}
      ${row("Ghi chú", d.ghichu)}
      ${row("Sinh hạ", d.sinhha)}
    </div>
  `;

  spouseBox.innerHTML = `
    <div class="info-card">
      <div class="info-title">Vợ (Chồng) – Con</div>
      ${Array.isArray(d.vo) && d.vo.length ? d.vo.map((v,i) => `
        <div class="spouse-box">
          <div class="spouse-title">Vợ ${i+1}</div>
          ${row("Họ và tên", v.tenvo)}
          ${row("Thường gọi", v.goivo)}
          ${row("Nguyên quán", v.quevo)}
          ${row("Cha", v.chavo)}
          ${row("Mẹ", v.mevo)}
          ${row("Sinh", v.sinhvo)}
          ${row("Mất (Giỗ)", v.matvo)}
          ${row("Mộ táng", v.movo)}
          ${row("Maps", mapBtn(v.mapvo))}
          ${row("Ghi chú", v.ghichuvo)}
          ${Array.isArray(v.con) && v.con.length ? `
            <div class="children-box">
              <div class="children-title">Con</div>
              ${v.con.map(c => `<div class="child-item">• ${c}</div>`).join("")}
            </div>` : ""}
        </div>`).join("") : `<div>Chưa có dữ liệu</div>`}
    </div>
  `;
}

function showTree() {
  document.querySelector(".tree-column")?.classList.remove("hidden");
  document.getElementById("tree-wrapper")?.classList.remove("hidden");
}

function showInfo() {
  document.querySelector(".info-column")?.classList.remove("hidden");
  document.getElementById("info-wrapper")?.classList.remove("hidden");
}

// =====================================================
// INFO – EVENT – YOUTUBE
// =====================================================
function isNew(ts) {
  if (!ts) return false;
  const DAY = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - ts < DAY;
}

function sortByTimeDesc(a, b) {
  return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
}

async function loadInfoSection() {
  await loadNoticeBox("content/notice");
  await loadImageBox("content/eventImage");
  await loadClipBox("content/eventClip");
  await loadYoutubeBox("content/youtube");
}

async function loadNoticeBox(path) {
  const box = document.getElementById("box-thongbao");
  if (!box) return;

  const raw = await firebaseGet(path);
  if (!raw) {
    box.style.display = "none";
    return;
  }

  const items = Object.entries(raw)
    .map(([id, v]) => ({ id, ...v }))
    .filter(v => v.status == 1 || v.status === undefined)
    .sort(sortByTimeDesc);

  if (!items.length) {
    box.style.display = "none";
    return;
  }

  box.style.display = "block";
  box.innerHTML = `
    <h4>Thông tin - Dòng lịch sử</h4>
    <div class="list">
      ${items.map(n => `
        <a href="notice.html?id=${n.id}" class="notice-item">
          ${n.thumb ? `<img src="${n.thumb}" class="thumb">` : ``}
          <div class="info">
            <div class="title">
              ${n.title || ""}
              ${isNew(n.updatedAt || n.createdAt) ? `<span class="tag-new">NEW</span>` : ``}
            </div>
          </div>
        </a>
      `).join("")}
    </div>
  `;
}

async function loadImageBox(path) {
  const box = document.getElementById("box-images");
  if (!box) return;

  const raw = await firebaseGet(path);
  if (!raw) return;

  const items = Object.values(raw).sort(sortByTimeDesc);

  box.innerHTML = `
    <h4>Ảnh tư liệu - sự kiện</h4>
    <div class="list">
      ${items.map(i => `
        <a class="media-item img-item" href="#" data-img="${i.image}">
          <img src="${i.image}">
          <span>${i.title || ""}</span>
        </a>
      `).join("")}
    </div>
  `;

  box.querySelectorAll(".img-item").forEach(el => {
    el.onclick = e => {
      e.preventDefault();
      openImageViewer(el.dataset.img);
    };
  });
}

async function loadClipBox(path) {
  const box = document.getElementById("box-videos");
  if (!box) return;

  const raw = await firebaseGet(path);
  if (!raw) return;

  const items = Object.values(raw).sort(sortByTimeDesc);

  box.innerHTML = `
    <h4>Clip ngắn </h4>
    <div class="timeline">
      ${items.map(v => {
        const idMatch = v.link.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
        const videoId = idMatch?.[1];
        return `
          <div class="timeline-item" data-video="${videoId || ""}">
            ${videoId ? `<img src="https://img.youtube.com/vi/${videoId}/default.jpg" alt="Thumbnail">` : ""}
            <span>${v.title || ""}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;

  let overlay = document.getElementById("clip-popup");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "clip-popup";
    overlay.className = "hidden";
    overlay.innerHTML = `
      <iframe frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      <button id="clip-close">×</button>
    `;
    document.body.appendChild(overlay);
  }

  const iframe = overlay.querySelector("iframe");
  const closeBtn = overlay.querySelector("#clip-close");

  box.querySelectorAll(".timeline-item").forEach(item => {
    item.onclick = () => {
      const vid = item.dataset.video;
      if (!vid) return;
      iframe.src = `https://www.youtube.com/embed/${vid}?autoplay=1`;
      overlay.classList.add("show");
    };
  });

  closeBtn.onclick = () => {
    iframe.src = "";
    overlay.classList.remove("show");
  };
}

async function loadYoutubeBox(path) {
  const box = document.getElementById("box-youtube");
  if (!box) return;

  const raw = await firebaseGet(path);
  if (!raw) return;

  const items = Object.values(raw).sort(sortByTimeDesc);

  box.innerHTML = `
    <h4>Phim tài liệu</h4>
    <div class="timeline">
      ${items.map(v => {
        const idMatch = v.link.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
        const videoId = idMatch?.[1];
        if (!videoId) return "";
        return `
          <div class="timeline-item" data-video="${videoId}">
            <img src="https://img.youtube.com/vi/${videoId}/default.jpg" alt="Thumbnail">
            <span>${v.title || ""}</span>
          </div>`;
      }).join("")}
    </div>
  `;

  let overlay = document.getElementById("youtube-popup");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "youtube-popup";
    overlay.className = "hidden";
    overlay.innerHTML = `
      <iframe frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      <button id="youtube-close">×</button>
    `;
    document.body.appendChild(overlay);
  }

  const iframe = overlay.querySelector("iframe");
  const closeBtn = overlay.querySelector("#youtube-close");

  box.querySelectorAll(".timeline-item").forEach(item => {
    item.onclick = () => {
      const vid = item.dataset.video;
      if (!vid) return;
      iframe.src = `https://www.youtube.com/embed/${vid}?autoplay=1`;
      overlay.classList.add("show");
    };
  });

  closeBtn.onclick = () => {
    iframe.src = "";
    overlay.classList.remove("show");
  };
}

function openImageViewer(src) {
  let viewer = document.getElementById("img-viewer");
  if (!viewer) {
    viewer = document.createElement("div");
    viewer.id = "img-viewer";
    viewer.innerHTML = `<img><span>×</span>`;
    document.body.appendChild(viewer);

    viewer.onclick = () => viewer.classList.remove("show");
  }

  viewer.querySelector("img").src = src;
  viewer.classList.add("show");
}

document.addEventListener("click", () => {
  const tooltip = document.getElementById("tooltip");
  if (tooltip) tooltip.style.display = "none";
  activeTooltipPersonId = null;
});


/* =====================================================
   ĐIỀU KHIỂN & LẬT SỔ GIA PHẢ 3D HOÀN CHỈNH
   ===================================================== */
document.addEventListener("click", function(e) {
  const openBtn = e.target.closest("#openBookBtn");
  const closeBtn = e.target.closest("#closeBookBtn");

  if (openBtn) {
    const cover = document.getElementById("closedCoverView");
    const book = document.getElementById("openBookView");
    if (cover && book && !cover.classList.contains("book-opening")) {
      initFamilyBook();
      book.hidden = false;
      book.style.display = "block";
      book.classList.remove("book-opening-view");
      void book.offsetWidth;
      book.classList.add("book-opening-view");
      cover.classList.add("book-opening");

      playFlipSound();

      cover.addEventListener("animationend", function onCoverOpen() {
        cover.removeEventListener("animationend", onCoverOpen);
        cover.style.display = "none";
        cover.classList.remove("book-opening");
        book.style.position = "relative";
        book.style.top = "auto";
      });
    }
  }

  if (closeBtn) {
    const cover = document.getElementById("closedCoverView");
    const book = document.getElementById("openBookView");
    if (cover && book) {
      book.hidden = true;
      book.style.display = "";
      cover.style.display = "flex";
      book.classList.remove("book-opening-view");
      book.style.position = "";
      book.style.top = "";
    }
  }
});

let familyBookPages = [];
let familyBookPageIndex = 0;
let familyBookSpreadIndex = 0;
let familyBookListPage = 0;
let familyBookMobilePageIndex = null;
let familyBookSelectedBranch = "";


function bookEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function bookPersonName(value) {
  if (value === undefined || value === null || String(value).trim() === "") return "";
  const id = String(value).trim();
  const person = (window.ALL_PEOPLE || []).find(p => String(p.id) === id);
  return person ? (person.name || person.data?.hovaten || id) : id;
}


function initFamilyBook(branchValue) {
  const container = document.getElementById("bookContainer");
  if (!container) return;

  const allPeople = window.ALL_PEOPLE || [];
  const branchSelect = document.getElementById("familyBookBranch");

  if (!allPeople.length) {
    container.innerHTML = '<p style="color:#d4af37;text-align:center;padding-top:100px;">Chưa có dữ liệu thành viên gia phả.</p>';
    return;
  }

  const branches = [...new Set(allPeople.map(p => String(p.data?.chinhap || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));

  if (branchSelect) {
    const currentValue = branchValue !== undefined ? branchValue : (familyBookSelectedBranch || branchSelect.value);
    branchSelect.innerHTML = '<option value="">Tất cả các chi</option>' + branches.map(branch => '<option value="' + bookEscape(branch) + '">' + bookEscape(branch) + '</option>').join("");
    branchSelect.value = branches.includes(currentValue) ? currentValue : "";
    familyBookSelectedBranch = branchSelect.value;
  } else {
    familyBookSelectedBranch = branchValue || "";
  }

  const people = familyBookSelectedBranch
    ? allPeople.filter(p => String(p.data?.chinhap || "").trim() === familyBookSelectedBranch)
    : allPeople;

  if (!people.length) {
    familyBookPages = [{ type: "title" }];
    container.innerHTML = '<p style="text-align:center;padding:40px;">Chi này chưa có dữ liệu thành viên.</p>';
    return;
  }

  const generations = {};
  people.forEach(person => {
    const data = person.data || {};
    const generation = String(data.doinhap ?? "Chưa xác định").trim() || "Chưa xác định";
    if (!generations[generation]) generations[generation] = [];
    generations[generation].push(person);
  });

  const generationKeys = Object.keys(generations).sort((a, b) => {
    const na = Number(a), nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b, "vi", { numeric: true });
  });

  familyBookPages = [
    { type: "title" },
    ...generationKeys.map(generation => ({
      type: "generation",
      generation,
      branch: familyBookSelectedBranch || "Tất cả các chi",
      people: generations[generation].slice().sort((a, b) =>
        (a.name || a.data?.hovaten || "").localeCompare(b.name || b.data?.hovaten || "", "vi")
      )
    }))
  ];

  familyBookSpreadIndex = 0;
  familyBookPageIndex = 0;
  familyBookMobilePageIndex = null;
  renderFamilyBookPage();
}


function renderFamilyBookPage() {
  const container = document.getElementById("bookContainer");
  const range = document.getElementById("pageRange");
  if (!container || !familyBookPages.length) return;

const pages = familyBookPages.slice();
if (pages.length % 2 !== 0) pages.push({ type: "end" });

const totalSheets = pages.length / 2;

  familyBookSpreadIndex = Math.max(0, Math.min(familyBookSpreadIndex, totalSheets));

  function pageContent(page) {
    if (!page) return '<div class="book-empty-page"></div>';

    if (page.type === "title") {
      return '<div style="text-align:center;padding-top:120px;color:#8b0000;">' +
             '<h2 style="font-size:2rem;margin-bottom:15px;">GIA PHẢ LƯU TRUYỀN</h2>' +
             '<p style="font-size:1.1rem;font-style:italic;color:#5a3e2b;">Hậu thế ghi nhớ công ơn tổ tiên</p>' +
             '<div style="margin-top:40px;border-top:1px double #8b0000;width:60%;margin-left:auto;margin-right:auto;"></div>' +
             '</div>';
    }

    if (page.type === "generation") {

      let html = '<h3 style="text-align:center;color:#8b0000;margin:0 0 12px;">' + bookEscape(page.branch || "Tất cả các chi") + '</h3><h2>ĐỜI ' + bookEscape(page.generation) + '</h2><p style="text-align:center;font-size:0.85rem;color:#6b523f;margin-bottom:12px;">Tổng số: ' + page.people.length + ' thành viên</p><div class="book-member-list">';
      page.people.forEach((person, i) => {
        html += '<button type="button" class="book-member-link" data-person-id="' + bookEscape(person.id) + '"><span><b>' + (i + 1) + '.</b> ' + bookEscape(person.name || "Chưa có họ tên") + '</span><span>➔</span></button>';
      });
      return html + '</div>';
    }

    if (page.type === "person") {
      const p = page.person;
      const d = p.data || {};
      let html = '<button type="button" class="backToGenerationBtn" data-generation="' + bookEscape(page.generation) + '">← Danh sách đời ' + bookEscape(page.generation) + '</button>';
      if (d.anh) html += '<img class="book-person-avatar" src="' + bookEscape(d.anh) + '" alt="Ảnh ' + bookEscape(p.name) + '">';
      html += '<h2>' + bookEscape(p.name || "Chưa có họ tên") + '</h2><div class="book-profile-fields">';
      [
        ["Tên thường gọi", d.thuonggoi],
        ["Chi", d.chinhap],
        ["Đời", d.doinhap],
        ["Ngày sinh", d.sinh],
        ["Ngày mất", d.mat],
        ["Cha", bookPersonName(d.cha)],
        ["Mẹ", bookPersonName(d.me)],
        ["Nghề nghiệp", d.nghiep],
        ["Mộ táng", d.motang],
        ["Bản đồ", d.map],
        ["Ghi chú", d.ghichu]
      ].forEach(([label, value]) => {
        if (value !== undefined && value !== null && String(value).trim()) html += '<p><strong>' + label + ':</strong> ' + bookEscape(value) + '</p>';
      });

      if (Array.isArray(d.vo) && d.vo.length) {
        html += '<h3>Vợ và các con</h3>';
        d.vo.forEach((wife, i) => {
          html += '<section class="book-wife"><p><strong>Vợ ' + (i + 1) + ':</strong> ' + bookEscape(wife.tenvo || "") + '</p>';
          [["Tên thường gọi", wife.goivo], ["Quê quán", wife.quevo], ["Cha", bookPersonName(wife.chavo)], ["Mẹ", bookPersonName(wife.mevo)], ["Ngày sinh", wife.sinhvo], ["Ngày mất", wife.matvo], ["Mộ táng", wife.movo], ["Ghi chú", wife.ghichuvo]].forEach(([label, value]) => {
            if (value) html += '<p><strong>' + label + ':</strong> ' + bookEscape(value) + '</p>';
          });
          if (Array.isArray(wife.con) && wife.con.length) html += '<p><strong>Các con:</strong> ' + wife.con.map(bookEscape).join(", ") + '</p>';
          html += '</section>';
        });
      }
      return html + '</div>';
    }

    return '<div style="text-align:center;padding-top:140px;color:#8b0000;"><h2>TẬP THÀNH HOÀN TẤT</h2><p style="margin-top:10px;font-style:italic;">Lưu truyền vạn đại</p></div>';
  }


  if (window.matchMedia("(max-width:600px)").matches) {
    if (familyBookMobilePageIndex === null) {
      familyBookMobilePageIndex = Math.min(familyBookSpreadIndex * 2, pages.length - 1);
    }
    familyBookMobilePageIndex = Math.max(0, Math.min(familyBookMobilePageIndex, pages.length - 1));
    const currentPage = familyBookMobilePageIndex;
    let mobileHtml = '<div class="sheet-page mobile-book-single-page"><div class="sheet-page-content">' + pageContent(pages[currentPage]) + '</div>';
    mobileHtml += '<div class="sheet-page-footer"><span>Gia Phả Trương Văn</span><span>Trang ' + (currentPage + 1) + '</span></div>';
    if (currentPage > 0) mobileHtml += '<button type="button" class="book-page-corner left" data-book-turn="prev" aria-label="Trang trước"></button>';
    if (currentPage < pages.length - 1) mobileHtml += '<button type="button" class="book-page-corner right" data-book-turn="next" aria-label="Trang sau"></button>';
    mobileHtml += '</div>';
    container.innerHTML = mobileHtml;
    container.style.overflow = "hidden";
    familyBookPageIndex = currentPage;
    if (range) range.textContent = "Trang " + (currentPage + 1) + " / " + pages.length;
    return;
  }

  let html = "";
  for (let i = 0; i < totalSheets; i++) {
    const frontIndex = i * 2;       // Mặt trước = Trang Lẻ (Trang 1, 3, 5...)
    const backIndex = i * 2 + 1;    // Mặt sau  = Trang Chẵn (Trang 2, 4, 6...)

html += '<div class="sheet ' + (i < familyBookSpreadIndex ? 'flipped' : '') + '" data-sheet="' + i + '" style="z-index:' + (i < familyBookSpreadIndex ? i + 1 : totalSheets - i) + '">';

    // Mặt trước (Mở ra thấy ngay ở bên phải)
    html += '<div class="sheet-page sheet-page-front page-seam-right">';
    html += '  <div class="sheet-page-content">' + pageContent(pages[frontIndex]) + '</div>';
    html += '  <div class="sheet-page-footer"><span>Gia Phả Trương Văn</span><span>Trang ' + (frontIndex + 1) + '</span></div>';
    html += '  <button type="button" class="book-page-corner right" data-book-turn="next" aria-label="Lật trang sau"></button>';
    html += '</div>';

    // Mặt sau (Khi lật tờ giấy qua trái sẽ lộn mặt này ra bên trái)
    html += '<div class="sheet-page sheet-page-back page-seam-left">';
    html += '  <div class="sheet-page-content">' + pageContent(pages[backIndex]) + '</div>';
    html += '  <div class="sheet-page-footer"><span>Trang ' + (backIndex + 1) + '</span><span>Hiền Lương - An Hội</span></div>';
    html += '  <button type="button" class="book-page-corner left" data-book-turn="prev" aria-label="Lật trang trước"></button>';
    html += '</div>';

    html += '</div>';
  }

  container.innerHTML = html;
  container.style.overflow = "hidden";
  familyBookPageIndex = familyBookSpreadIndex * 2;


if (range) {
  const firstPage = familyBookSpreadIndex * 2 + 1;
  const secondPage = Math.min(firstPage + 1, pages.length);
  range.textContent = firstPage === secondPage
    ? "Trang " + firstPage + " / " + pages.length
    : "Trang " + firstPage + "–" + secondPage + " / " + pages.length;
}
}

function turnFamilyBook(direction) {
  const container = document.getElementById("bookContainer");
  if (!container || !familyBookPages.length) return;

  if (window.matchMedia("(max-width:600px)").matches) {
    const totalPages = familyBookPages.length + (familyBookPages.length % 2);
    if (familyBookMobilePageIndex === null) {
      familyBookMobilePageIndex = Math.min(familyBookSpreadIndex * 2, totalPages - 1);
    }
    if (direction === "next") {
      if (familyBookMobilePageIndex >= totalPages - 1) return;
      familyBookMobilePageIndex++;
    } else {
      if (familyBookMobilePageIndex <= 0) return;
      familyBookMobilePageIndex--;
    }
    playFlipSound();
    familyBookPageIndex = familyBookMobilePageIndex;
    renderFamilyBookPage();
    return;
  }

  const sheets = [...container.querySelectorAll(".sheet")];
  const totalSheets = sheets.length;

  if (direction === "next") {
    if (familyBookSpreadIndex >= totalSheets) return;
    const sheet = sheets[familyBookSpreadIndex];
    if (!sheet) return;
    sheet.classList.add("flipped");
    familyBookSpreadIndex++;
    setTimeout(() => {
      sheets.forEach((item, i) => {
        item.style.zIndex = i < familyBookSpreadIndex ? i + 1 : totalSheets - i;
      });
    }, 900);
  } else {
    if (familyBookSpreadIndex <= 0) return;
    familyBookSpreadIndex--;
    sheets.forEach((item, i) => {
      item.style.zIndex = i < familyBookSpreadIndex ? i + 1 : totalSheets - i;
    });
    const sheet = sheets[familyBookSpreadIndex];
    if (sheet) sheet.classList.remove("flipped");
  }

  playFlipSound();
  familyBookPageIndex = familyBookSpreadIndex * 2;
  const range = document.getElementById("pageRange");

if (range) {
  const firstPage = familyBookSpreadIndex * 2 + 1;
  const secondPage = Math.min(firstPage + 1, familyBookPages.length);
  range.textContent = firstPage === secondPage
    ? "Trang " + firstPage + " / " + familyBookPages.length
    : "Trang " + firstPage + "–" + secondPage + " / " + familyBookPages.length;
}
}


function jumpToFamilyBookPage(pageIndex) {
  const container = document.getElementById("bookContainer");
  if (!container) return;
  const spread = Math.floor(pageIndex / 2);
  familyBookSpreadIndex = Math.max(0, Math.min(spread, Math.ceil(familyBookPages.length / 2)));
  container.querySelectorAll(".sheet").forEach((sheet, i) => {
    sheet.classList.toggle("flipped", i < familyBookSpreadIndex);
  });
  playFlipSound();
  familyBookPageIndex = familyBookSpreadIndex * 2;
  const range = document.getElementById("pageRange");
  if (range) {
    const currentDisplayPage = familyBookSpreadIndex === 0 ? 1 : (familyBookSpreadIndex * 2) + " - " + (familyBookSpreadIndex * 2 + 1);
    range.textContent = "Trang " + currentDisplayPage + " / " + familyBookPages.length;
  }
}

function playFlipSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (e) {}
}

function renderFamilyPersonModal(person) {
  const modal = document.getElementById("familyPersonModal");
  const content = document.getElementById("familyPersonModalContent");
  if (!modal || !content || !person) return;

  const d = person.data || {};
  let html = "";

  if (d.anh) html += '<img class="book-person-avatar" src="' + bookEscape(d.anh) + '" alt="Ảnh ' + bookEscape(person.name || "") + '">';
  html += '<h2>' + bookEscape(person.name || "Chưa có họ tên") + '</h2><div class="book-profile-fields">';

  [
    ["Tên thường gọi", d.thuonggoi],
    ["Chi", d.chinhap],
    ["Đời", d.doinhap],
    ["Ngày sinh", d.sinh],
    ["Ngày mất", d.mat],
    ["Cha", bookPersonName(d.cha)],
    ["Mẹ", bookPersonName(d.me)],
    ["Nghề nghiệp", d.nghiep],
    ["Mộ táng", d.motang],
    ["Bản đồ", d.map],
    ["Ghi chú", d.ghichu]
  ].forEach(([label, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      html += '<p><strong>' + label + ':</strong> ' + bookEscape(value) + '</p>';
    }
  });

  if (Array.isArray(d.vo) && d.vo.length) {
    html += '<h3>Vợ và các con</h3>';
    d.vo.forEach((wife, i) => {
      html += '<section class="book-wife"><p><strong>Vợ ' + (i + 1) + ':</strong> ' + bookEscape(wife.tenvo || "") + '</p>';
      [
        ["Tên thường gọi", wife.goivo],
        ["Quê quán", wife.quevo],
        ["Cha", bookPersonName(wife.chavo)],
        ["Mẹ", bookPersonName(wife.mevo)],
        ["Ngày sinh", wife.sinhvo],
        ["Ngày mất", wife.matvo],
        ["Mộ táng", wife.movo],
        ["Ghi chú", wife.ghichuvo]
      ].forEach(([label, value]) => {
        if (value !== undefined && value !== null && String(value).trim()) {
          html += '<p><strong>' + label + ':</strong> ' + bookEscape(value) + '</p>';
        }
      });
      if (Array.isArray(wife.con) && wife.con.length) {
        html += '<p><strong>Các con:</strong> ' + wife.con.map(bookEscape).join(", ") + '</p>';
      }
      html += '</section>';
    });
  }

  content.innerHTML = html + '</div>';
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeFamilyPersonModal() {
  const modal = document.getElementById("familyPersonModal");
  if (modal) modal.hidden = true;
  document.body.style.overflow = "";
}

document.addEventListener("click", function(e) {
  const memberButton = e.target.closest(".book-member-link");
  if (memberButton) {
    const personId = memberButton.dataset.personId;
    const person = (window.ALL_PEOPLE || []).find(p => String(p.id) === String(personId));
    if (person) renderFamilyPersonModal(person);
    return;
  }

  if (e.target.closest("#backFamilyPersonModal") || e.target.closest("#closeFamilyPersonModal") || e.target.classList.contains("family-person-modal-backdrop")) {
    closeFamilyPersonModal();
    return;
  }

  if (e.target.closest("#prevBtn")) turnFamilyBook("prev");
  if (e.target.closest("#nextBtn")) turnFamilyBook("next");

  const corner = e.target.closest("[data-book-turn]");
  if (corner) turnFamilyBook(corner.dataset.bookTurn);
});

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") closeFamilyPersonModal();
});


document.getElementById("familyBookBranch")?.addEventListener("change", function() {
  familyBookSelectedBranch = this.value;
  familyBookSpreadIndex = 0;
  familyBookPageIndex = 0;
  familyBookMobilePageIndex = null;
  initFamilyBook(this.value);
});
