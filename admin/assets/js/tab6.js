import {
  addYoutube,
  getYoutubes,
  updateYoutube,
  deleteYoutube
} from "/src/services/contentService.js";

const titleEl = document.getElementById("yt-title");
const linkEl  = document.getElementById("yt-link");
const addBtn  = document.getElementById("yt-add");
const listEl  = document.getElementById("yt-list");

let editId = null;
let cache  = [];

/* =========================
   LOAD
========================= */
async function loadYt(){
  cache = await getYoutubes();
  render();
}

/* =========================
   RENDER
========================= */
function render(){
  listEl.innerHTML = "";

  cache.forEach((item, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${item.title || ""}</td>
      <td><a href="${item.link}" target="_blank">Mở</a></td>
      <td>${renderPreview(item.link)}</td>
      <td><button>Xóa</button></td>
    `;

    // chọn để sửa
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

  const id =
    link.includes("youtu.be")
      ? link.split("/").pop()
      : link.split("v=")[1]?.split("&")[0];

  if (!id) return "";

  return `
    <iframe width="160" height="90"
      src="https://www.youtube.com/embed/${id}"
      allowfullscreen></iframe>
  `;
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
    await updateYoutube(editId, data);
  } else {
    await addYoutube({
      ...data,
      createdAt: Date.now()
    });
  }

  resetForm();
  loadYt();
};

/* =========================
   DELETE
========================= */
async function handleDelete(id){
  if (!confirm("Xóa video này?")) return;
  await deleteYoutube(id);
  loadYt();
}

/* =========================
   INIT
========================= */
loadYt();
