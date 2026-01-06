// ================== IMPORTS ==================
import { addTruong, getTruong, deleteTruong, getChi } from "/src/services/contentService.js";

/* ================== STATE ================== */
let chiList = [];
let truongList = [];
let anhBase64 = "";
let editingId = null;

/* ================== INIT ================== */
document.addEventListener("DOMContentLoaded", async () => {
  if (!document.getElementById("tab2")) return;

  await loadChiToSelect();
  await loadTruong();
  bindEvents();
});

/* ================== LOAD CHI ================== */
async function loadChiToSelect() {
  chiList = await getChi();
  const sel = id("id-chitruong");
  sel.innerHTML = `<option value="">-- chọn chi --</option>`;
  chiList.forEach(c => {
    const op = document.createElement("option");
    op.value = c.id;
    op.textContent = c.name;
    sel.appendChild(op);
  });
}

/* ================== LOAD TRƯỞNG ================== */
async function loadTruong() {
  truongList = await getTruong();
  renderTruong();
}

function renderTruong() {
  const tb = id("truong-list");
  tb.innerHTML = "";

  truongList.forEach((x, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${x.anh ? `<img src="${x.anh}" style="width:40px;height:40px;border-radius:50%">` : ""}</td>
      <td>${x.hovaten}</td>
      <td>${x.doi}</td>
      <td>${x.chiName}</td>
      <td><button data-id="${x.id}">X</button></td>
    `;

    /* ===== CLICK DÒNG => EDIT ===== */
    tr.onclick = () => fillForm(x);

    /* ===== DELETE ===== */
    tr.querySelector("button").onclick = async e => {
      e.stopPropagation();
      if (!confirm("Xóa người này?")) return;
      await deleteTruong(x.id);
      await loadTruong();
    };

    tb.appendChild(tr);
  });
}

/* ================== EVENTS ================== */
function bindEvents() {

  // preview ảnh
  id("id-anhtruong").onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      anhBase64 = reader.result;
      id("preview-anhtruong").src = anhBase64;
      id("preview-anhtruong").style.display = "block";
    };
    reader.readAsDataURL(file);
  };

  // THÊM
  id("btn-add-truong").onclick = async () => {
    await saveData(false);
  };

  // LƯU (EDIT)
  id("btn-save-truong").onclick = async () => {
    if (!editingId) return;
    await saveData(true);
  };
}

/* ================== SAVE ================== */
async function saveData(isEdit) {
  const hovaten = val("id-hovaten-truong");
  const doi = val("id-doitruong");
  const chiId = val("id-chitruong");

  if (!hovaten || !doi || !chiId) return alert("Thiếu dữ liệu");

  const chi = chiList.find(c => c.id === chiId);

  const data = {
    hovaten,
    doi,
    chiId,
    chiName: chi?.name || "",
    anh: anhBase64
  };

  if (isEdit) await deleteTruong(editingId);
  await addTruong(data);

  resetForm();
  await loadTruong();
}

/* ================== FILL FORM ================== */
function fillForm(x) {
  editingId = x.id;

  id("id-hovaten-truong").value = x.hovaten;
  id("id-doitruong").value = x.doi;
  id("id-chitruong").value = x.chiId;

  if (x.anh) {
    anhBase64 = x.anh;
    id("preview-anhtruong").src = x.anh;
    id("preview-anhtruong").style.display = "block";
  }

  id("btn-add-truong").style.display = "none";
  id("btn-save-truong").style.display = "inline-block";
}

/* ================== RESET ================== */
function resetForm() {
  editingId = null;
  anhBase64 = "";

  id("id-hovaten-truong").value = "";
  id("id-doitruong").value = "";
  id("id-chitruong").value = "";
  id("id-anhtruong").value = "";

  id("preview-anhtruong").style.display = "none";
  id("btn-add-truong").style.display = "inline-block";
  id("btn-save-truong").style.display = "none";
}

/* ================== UTILS ================== */
const id = i => document.getElementById(i);
const val = i => id(i)?.value.trim() || "";
