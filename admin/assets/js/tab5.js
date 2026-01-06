import {
  addEventClip,
  getEventClips,
  deleteEventClip,
  updateEventClip
} from "/src/services/contentService.js";


const titleEl = document.getElementById("clip-title");
const linkEl  = document.getElementById("clip-link");
const addBtn  = document.getElementById("clip-add");
const listEl  = document.getElementById("clip-list");

let editId = null;
let cache  = [];

/* =========================
   LOAD DATA
========================= */
async function loadClips(){
  cache = await getEventClips();
  render();
}

/* =========================
   RENDER TABLE
========================= */
function render(){
  listEl.innerHTML = "";

  cache.forEach((item, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${item.title || ""}</td>
      <td>
        <a href="${item.link}" target="_blank">Mở</a>
      </td>
      <td>${renderPreview(item.link)}</td>
      <td>
        <button data-id="${item.id}">Xóa</button>
      </td>
    `;

    // click dòng để sửa
    tr.onclick = () => fillForm(item);

    // xóa
    tr.querySelector("button").onclick = (e) => {
      e.stopPropagation();
      handleDelete(item.id);
    };

    listEl.appendChild(tr);
  });
}

/* =========================
   PREVIEW
========================= */
function renderPreview(link){
  if (!link) return "";

  // youtube
  if (link.includes("youtube.com") || link.includes("youtu.be")) {
    const id =
      link.includes("youtu.be")
        ? link.split("/").pop()
        : link.split("v=")[1]?.split("&")[0];

    return `
      <iframe width="160" height="90"
        src="https://www.youtube.com/embed/${id}"
        allowfullscreen></iframe>
    `;
  }

  // mp4
  if (link.endsWith(".mp4")) {
    return `<video src="${link}" width="160" height="90" controls></video>`;
  }

  return "";
}

/* =========================
   FORM
========================= */
function fillForm(item){
  editId = item.id;
  titleEl.value = item.title || "";
  linkEl.value  = item.link || "";
  addBtn.textContent = "Lưu";
}

function resetForm(){
  editId = null;
  titleEl.value = "";
  linkEl.value  = "";
  addBtn.textContent = "Thêm";
}

/* =========================
   ADD / SAVE
========================= */
addBtn.onclick = async () => {
  if (!titleEl.value || !linkEl.value) {
    alert("Thiếu nội dung hoặc link");
    return;
  }

  const data = {
    title: titleEl.value,
    link : linkEl.value,
    updatedAt: Date.now()
  };

  if (editId) {
    await updateEventClip(editId, data);
  } else {
    await addEventClip({
      ...data,
      createdAt: Date.now()
    });
  }

  resetForm();
  loadClips();
};

/* =========================
   DELETE
========================= */
async function handleDelete(id){
  if (!confirm("Xóa clip này?")) return;
  await deleteEventClip(id);
  loadClips();
}

/* =========================
   INIT
========================= */
loadClips();
