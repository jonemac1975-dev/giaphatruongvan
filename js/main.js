// =====================================================
// MAIN.JS – FINAL VERSION
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
  header.style.setProperty("--header-bg", `url("${images[0]}")`);

  if (images.length > 1) {
    setInterval(() => {
      i = (i + 1) % images.length;
      header.style.setProperty("--header-bg", `url("${images[i]}")`);
    }, 10000);
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

    // ===== TRƯỞNG HỌ =====
    if (item.chiName === "Trương Văn") {
      const img = document.getElementById("img-chief");
      if (img) img.src = item.anh;
      return;
    }

    // ===== CÁC CHI =====
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
// TREE – 3 GENERATION ONLY (FINAL, STABLE)
// =====================================================

const IS_MOBILE = window.innerWidth <= 768;
const MOBILE_COL_X = {
  0: 40,    // CHA
  1: 260,   // NGƯỜI ĐANG XEM
  2: 480    // CON
};

let tooltipLocked = false;
let activeTooltipPersonId = null;


const CHILD_GAP_DESKTOP = 8;   // mặc định ~15 → giảm cho sít
const CHILD_GAP_MOBILE  = 6;  // mobile nên nhỏ hơn

const NODE_W = 200;
const NODE_H = IS_MOBILE ? 48 : 55;   // 🔑 mobile thấp hơn

const nameY = IS_MOBILE ? 22 : 30;
const metaY = IS_MOBILE ? 36 : 46;


function render3GenTree(centerPerson) {
  const svg = document.getElementById("genealogy-svg");
  if (!svg || !centerPerson) return;

  svg.innerHTML = "";

  const map = new Map(ALL_PEOPLE.map(p => [p.id, p]));

  const father = centerPerson.fatherId ? map.get(centerPerson.fatherId) : null;
  const children = ALL_PEOPLE.filter(p => p.fatherId === centerPerson.id);

  // ===== NODE THEO THỨ TỰ TRÊN → DƯỚI =====
  const nodes = [];
  if (father && father.id) {
  nodes.push({ ...father, _level: 0 });
}

  nodes.push({ ...centerPerson, _level: 1 });
  children.forEach(c => nodes.push({ ...c, _level: 2 }));

  // ===== LAYOUT CỐ ĐỊNH =====
 // GAP_X nhỏ hơn để các con gần nhau
  const GAP_X = 15;
  const GAP_Y = 90;


  const levelGroups = {
    0: nodes.filter(n => n._level === 0),
    1: nodes.filter(n => n._level === 1),
    2: nodes.filter(n => n._level === 2)
  };

  const pos = {};
  

// ===== PASS 1: VẼ NODE CON =====
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


if (IS_MOBILE && window.__treeCenterY == null) {
  window.__treeCenterY = 40;
}

if (!IS_MOBILE && window.__treeCenterX == null) {
  window.__treeCenterX = 40;
}


// ===== PASS 2: VẼ NODE CHA =====
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
}); // 👈 BẮT BUỘC: đóng forEach ( )

showTree(); // 👈 nằm NGOÀI


  // ===== FIX SVG SIZE + VIEWBOX =====
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
Object.values(pos).forEach(p => {
  minX = Math.min(minX, p.x);
  maxX = Math.max(maxX, p.x + (IS_MOBILE ? NODE_H : NODE_W));
  minY = Math.min(minY, p.y);
  maxY = Math.max(maxY, p.y + (IS_MOBILE ? NODE_W : NODE_H));
});

  const PAD_X = 80, PAD_Y = 60;
  const width = maxX - minX + PAD_X * 2;
  const height = maxY - minY + PAD_Y * 2;

  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `${minX - PAD_X} ${minY - PAD_Y} ${width} ${height}`);


// ===== AUTO FIT MOBILE VIEW =====
if (IS_MOBILE) {
  svg.style.width = "100vw";
  svg.style.height = "calc(100vh - 140px)"; // trừ header + tab
  svg.style.maxWidth = "100%";
  svg.style.maxHeight = "100%";
}


  // ===== DÂY NỐI =====
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

  // ===== NODE + TEXT + TOOLTIP =====
  const tooltip = document.getElementById("tooltip");
let activeTooltipPersonId = null;

nodes.forEach(p => {
  if (!pos[p.id]) return;

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute(
    "transform",
    `translate(${pos[p.id].x},${pos[p.id].y})`
  );
  g.style.cursor = "pointer";

  // rect nền
  const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  r.setAttribute("width", NODE_W);
  r.setAttribute("height", NODE_H);
  r.setAttribute("rx", 8);
  r.setAttribute("fill", "#fff");
  r.setAttribute("stroke", p.id === centerPerson.id ? "#c0392b" : "#333");
  r.setAttribute("stroke-width", p.id === centerPerson.id ? "2" : "1");

  // ảnh
  const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
  img.setAttribute("x", 6);
  img.setAttribute("y", 6);
  img.setAttribute("width", 44);
  img.setAttribute("height", 44);
  img.setAttribute("href", p.avatar || "https://via.placeholder.com/44");

  // tên
  const name = document.createElementNS("http://www.w3.org/2000/svg", "text");
  name.setAttribute("x", 56);
  name.setAttribute("y", nameY);
  name.setAttribute("font-size", "13");
  name.setAttribute("font-weight", "600");
  name.textContent = p.name || "Không tên";

  // meta
  const doi = (p.doinhap ?? p.data?.doinhap ?? (p._level + 1));
  const meta = document.createElementNS("http://www.w3.org/2000/svg", "text");
  meta.setAttribute("x", 56);
  meta.setAttribute("y", metaY);
  meta.setAttribute("font-size", "11");
  meta.setAttribute("fill", "#666");
  meta.textContent = `${p.birth || "Chưa rõ"} – Đời ${doi}`;

  g.append(r, img, name, meta);
  svg.appendChild(g);

  // ===== TOOLTIP HTML =====
  const renderTooltipHTML = () => `
    <strong>${p.name || "Không tên"}</strong><br>
    Sinh: ${p.birth || "Chưa rõ"}<br>
    Đời: ${doi}<br>
    Chi: ${p.branch || "?"}
  `;

  // ===== PC: HOVER TOOLTIP =====
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

  // ===== CLICK NODE (PC + MOBILE) =====
  g.addEventListener("click", e => {

    // ===== MOBILE =====
    if (IS_MOBILE) {
      e.preventDefault();
      e.stopPropagation();

      // tap lần 2 → load 3 đời
      if (activeTooltipPersonId === p.id) {
        activeTooltipPersonId = null;
        if (tooltip) tooltip.style.display = "none";

        showTree();
        showInfo();
        showPersonInfo(p);
        render3GenTree(p);
        return;
      }

      // tap lần 1 → tooltip
      activeTooltipPersonId = p.id;
      if (tooltip) {
        tooltip.innerHTML = renderTooltipHTML();
        tooltip.style.display = "block";
        tooltip.style.left = e.pageX + "px";
        tooltip.style.top = e.pageY + "px";
      }
      return;
    }

    // ===== PC =====
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

  // ===== CLICK CHI: CHỈ MỞ PANEL, KHÔNG VẼ CÂY =====
  document.querySelectorAll(".branch").forEach(b => {
  b.addEventListener("click", () => {
    showTree();
    renderChiDoiList(b.dataset.chi); // ⭐ load list thay vì cây
  });
});


  // ===== CLICK TRƯỞNG HỌ: CHỈ MỞ PANEL CHỌN =====
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
    )].sort((a,b) => a-b);

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


function loadListByChi(chi) {
  const selChi = document.getElementById("chi");
  const selDoi = document.getElementById("doi");
  const selTen = document.getElementById("ten");

  if (!selChi || !selDoi || !selTen) return;

  // set chi
  selChi.value = chi || "";

  // reset
  selDoi.innerHTML = `<option value="">Chọn đời</option>`;
  selTen.innerHTML = `<option value="">Chọn tên</option>`;

  if (!chi) return;

  // load danh sách đời
  const doiList = [...new Set(
    ALL_PEOPLE
      .filter(p => p.data?.chinhap === chi)
      .map(p => Number(p.data?.doinhap))
      .filter(n => Number.isFinite(n))
  )].sort((a, b) => a - b);

  doiList.forEach(d =>
    selDoi.innerHTML += `<option value="${d}">Đời ${d}</option>`
  );
}

function renderChiDoiList(chi) {
  const wrap = document.getElementById("tree-wrapper");
  const svg = document.getElementById("genealogy-svg");
  if (!wrap) return;

  // Ẩn SVG
  if (svg) svg.style.display = "none";

  // Box list
  let listBox = document.getElementById("genealogy-list");
  if (!listBox) {
    listBox = document.createElement("div");
    listBox.id = "genealogy-list";
    listBox.className = "genealogy-list";
    wrap.appendChild(listBox);
  }

  // Lọc theo chi
  const people = ALL_PEOPLE.filter(p => p.data?.chinhap === chi);

  // Gom theo đời
  const doiMap = {};
  people.forEach(p => {
    const d = Number(p.data?.doinhap);
    if (!Number.isFinite(d)) return;
    if (!doiMap[d]) doiMap[d] = [];
    doiMap[d].push(p);
  });

  const doiList = Object.keys(doiMap).map(Number).sort((a, b) => a - b);

  // Render: CHỈ ĐỜI
  listBox.innerHTML = `
    <div class="chi-title">${chi}</div>
    ${doiList.map(d => `
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

  // Click ĐỜI → bung / gập danh sách
  listBox.querySelectorAll(".doi-title").forEach(title => {
    title.onclick = () => {
      const ul = title.nextElementSibling;
      if (!ul) return;

      // gập các đời khác cho gọn
      listBox.querySelectorAll(".doi-names").forEach(x => {
        if (x !== ul) x.style.display = "none";
      });

      ul.style.display = ul.style.display === "none" ? "block" : "none";
    };
  });

  // Click TÊN → vẽ cây
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


function getThreeGenerationPeople(person) {
  if (!person) return [];
  const map = new Map(ALL_PEOPLE.map(p => [p.id, p]));
  const result = [];

  // CHA
  if (person.fatherId && map.has(person.fatherId)) result.push(map.get(person.fatherId));
  // NGƯỜI HIỆN TẠI
  result.push(person);
  // CON
  const children = ALL_PEOPLE.filter(p => p.fatherId === person.id);
  if (children.length) result.push(...children);

  return result;
}

function mapField(label, url) {
  return `
    <div class="info-row">
      <span class="info-label">${label}</span>
      <span class="info-value">${url ? `<a href="${url}" target="_blank">[tìm mộ]</a>` : `<span class="map-empty">chưa có link</span>`}</span>
    </div>
  `;
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
// INFO – EVENT – YOUTUBE (FINAL CLEAN VERSION)
// =====================================================

function toYoutubeEmbed(url = "") {
  const id = url.match(/v=([^&]+)/)?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : "";
}

function isNew(ts) {
  if (!ts) return false;
  const DAY = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - ts < DAY;
}

function sortByTimeDesc(a, b) {
  return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
}

// =====================================================
// LOAD ALL
// =====================================================
async function loadInfoSection() {
  await loadNoticeBox("content/notice");
  await loadImageBox("content/eventImage");
  await loadClipBox("content/eventClip");
  await loadYoutubeBox("content/youtube");
}

// =====================================================
// 1. THÔNG TIN – THÔNG BÁO
// =====================================================
async function loadNoticeBox(path) {
  const box = document.getElementById("box-thongbao");
  if (!box) return;

  const raw = await firebaseGet(path);
  if (!raw) return;

  const items = Object.entries(raw)
    .map(([id, v]) => ({ id, ...v }))
    .filter(v => v.status === 1)
    .sort(sortByTimeDesc);

  box.innerHTML = `
    <h4>Thông tin</h4>
    <div class="list">
      ${items.map(n => `
        <div class="list-item">
          <a href="notice.html?id=${n.id}">
            ${n.title || ""}
          </a>
          ${isNew(n.updatedAt || n.createdAt)
            ? `<span class="tag-new">NEW</span>`
            : ""}
        </div>
      `).join("")}
    </div>
  `;
}

// =====================================================
// 2. ẢNH SỰ KIỆN
// =====================================================
async function loadImageBox(path) {
  const box = document.getElementById("box-images");
  if (!box) return;

  const raw = await firebaseGet(path);
  if (!raw) return;

  const items = Object.values(raw).sort(sortByTimeDesc);

  box.innerHTML = `
    <h4>Ảnh</h4>
    <div class="list">
      ${items.map(i => `
        <a class="media-item img-item" href="#" data-img="${i.image}">
          <img src="${i.image}">
          <span>${i.title || ""}</span>
        </a>
      `).join("")}
    </div>
  `;

  // click xem ảnh lớn (KHÔNG target=_blank)
  box.querySelectorAll(".img-item").forEach(el => {
    el.onclick = e => {
      e.preventDefault();
      openImageViewer(el.dataset.img);
    };
  });
}


// =====================================================
// 3. CLIP SỰ KIỆN (popup mini góc dưới)
// =====================================================
async function loadClipBox(path) {
  const box = document.getElementById("box-videos");
  if (!box) return;

  const raw = await firebaseGet(path);
  if (!raw) return;

  const items = Object.values(raw).sort(sortByTimeDesc);

  // render timeline với thumbnail
  box.innerHTML = `
    <h4>Clip</h4>
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

  // tạo mini popup nếu chưa có
  let overlay = document.getElementById("clip-popup");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "clip-popup";
    overlay.className = "hidden";
    overlay.innerHTML = `
      <iframe frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>
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
      overlay.classList.add("show"); // hiển thị mini popup
    };
  });

  closeBtn.onclick = () => {
    iframe.src = "";
    overlay.classList.remove("show");
  };
}


// =====================================================
// 4. YOUTUBE TIMELINE (popup mini góc dưới)
// =====================================================
async function loadYoutubeBox(path) {
  const box = document.getElementById("box-youtube");
  if (!box) return;

  const raw = await firebaseGet(path);
  if (!raw) return;

  const items = Object.values(raw).sort(sortByTimeDesc);

  box.innerHTML = `
    <h4>Youtube</h4>
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

  // tạo mini popup nếu chưa có
  let overlay = document.getElementById("youtube-popup");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "youtube-popup";
    overlay.className = "hidden";
    overlay.innerHTML = `
      <iframe frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>
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

// =====================================================
// View imag
// =====================================================
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


// ===== MOBILE: TAP OUTSIDE TO CLOSE TOOLTIP =====
document.addEventListener("click", () => {
  const tooltip = document.getElementById("tooltip");
  if (tooltip) tooltip.style.display = "none";
  activeTooltipPersonId = null;
});
