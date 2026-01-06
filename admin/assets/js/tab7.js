import {
  addHeadBg,
  getHeadBgs,
  deleteHeadBg,
  updateHeadBg
} from "/src/services/contentService.js";

/* ===============================
   ELEMENTS
================================ */
const titleEl = document.getElementById("bg-title");
const nameEl  = document.getElementById("bg-name");
const fileEl  = document.getElementById("bg-file");
const addBtn  = document.getElementById("bg-add");
const listEl  = document.getElementById("bg-list");

let cache = [];
let editingId = null;
let currentImage = null;

/* ===============================
   BASE64 HELPER
================================ */
function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ===============================
   LOAD
================================ */
async function loadBg(){
  cache = await getHeadBgs();
  render();
}

/* ===============================
   RENDER
================================ */
function render(){
  listEl.innerHTML = "";

  cache.forEach((item, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${item.title || ""}</td>
      <td>${item.file || ""}</td>
      <td>
        ${item.image ? `<img src="${item.image}" style="height:40px">` : ""}
      </td>
      <td><button>Xóa</button></td>
    `;

    tr.onclick = () => fillForm(item);

    tr.querySelector("button").onclick = (e) => {
      e.stopPropagation();
      handleDelete(item.id);
    };

    listEl.appendChild(tr);
  });
}

/* ===============================
   FILL FORM
================================ */
function fillForm(item){
  editingId = item.id;
  titleEl.value = item.title || "";
  nameEl.value  = item.file || "";
  currentImage  = item.image || null;
  addBtn.textContent = "Lưu";
}

/* ===============================
   ADD / UPDATE
================================ */
addBtn.onclick = async () => {
  const title = titleEl.value.trim();
  const fileName = nameEl.value;
  const file = fileEl.files[0];

  let image = currentImage;

  if (file) {
    image = await fileToBase64(file);
  }

  if (!image) {
    alert("Chưa có ảnh");
    return;
  }

  const data = {
    title,
    file: fileName,
    image,
    updatedAt: Date.now()
  };

  if (editingId) {
    await updateHeadBg(editingId, data);
  } else {
    await addHeadBg({
      ...data,
      createdAt: Date.now()
    });
  }

  resetForm();
  loadBg();
};

/* ===============================
   DELETE
================================ */
async function handleDelete(id){
  if (!confirm("Xóa ảnh này?")) return;
  await deleteHeadBg(id);
  loadBg();
}

/* ===============================
   RESET
================================ */
function resetForm(){
  editingId = null;
  currentImage = null;
  titleEl.value = "";
  fileEl.value = "";
  addBtn.textContent = "Thêm";
}

/* ===============================
   INIT
================================ */
loadBg();
