import {
  addChi,
  getChi,
  deleteChi
} from "/src/services/contentService.js";

let chiList = [];

document.addEventListener("DOMContentLoaded", () => {
  loadChi();
  bindEvents();
});

/* ================= LOAD ================= */
async function loadChi(){
  chiList = await getChi();
  render();
}

/* ================= EVENTS ================= */
function bindEvents(){
  id("chi-add").onclick = async ()=>{
    const name = val("chi-name");
    if(!name) return alert("Nhập tên chi");
    await addChi(name);
    id("chi-name").value = "";
    loadChi();
  };
}

/* ================= RENDER ================= */
function render(){
  const tb = id("chi-list");
  tb.innerHTML = "";

  chiList.forEach((c,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${c.name}</td>
      <td>
        <button data-id="${c.id}">Xóa</button>
      </td>
    `;
    tr.querySelector("button").onclick = async ()=>{
      if(!confirm("Xóa chi này?")) return;
      await deleteChi(c.id);
      loadChi();
    };
    tb.appendChild(tr);
  });
}

/* ================= UTILS ================= */
const id = i=>document.getElementById(i);
const val = i=>id(i)?.value.trim() || "";
