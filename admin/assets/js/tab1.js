/* ======================================================
   TAB 1 – CÁ NHÂN (FULL FINAL)
====================================================== */
import { addPerson, getPeople, updatePerson, deletePerson, getChi } from "/src/services/contentService.js";

(() => {

  let people = [];
  let current = null;

  document.addEventListener("DOMContentLoaded", async () => {
    await loadPeople();
    await initChiForm();
    await initChiSearch();
    bindButtons();
    bindAvatarPreview();
  });

  /* ================== LOAD ================== */
  async function loadPeople(){
    people = await getPeople();
    renderTree();
    refreshTenSearch();
  }

  /* ================== FORM CHI/ĐỜI ================== */
  async function initChiForm(){
    const chiDrop = id("id-chinhap-form");
    chiDrop.innerHTML = `<option value="">-- Chọn Chi --</option>`;
    const chiList = await getChi();
    chiList.forEach(c=>{
      chiDrop.insertAdjacentHTML("beforeend", `<option value="${c.name}">${c.name}</option>`);
    });
    chiDrop.onchange = refreshDoiForm;
  }

  function refreshDoiForm(){
    const chi = val("id-chinhap-form");
    const doiDrop = id("id-doinhap-form");
    doiDrop.innerHTML = `<option value="0">Tiền Tổ</option>`;
    if(!chi) return;

    const doiList = [...new Set(
      people.filter(p=>p.chinhap===chi).map(p=>Number(p.doinhap))
    )].sort((a,b)=>a-b);
    doiList.forEach(d => doiDrop.insertAdjacentHTML("beforeend", `<option value="${d}">Đời ${d}</option>`));

    doiDrop.onchange = loadChaMe;
    if(current?.doinhap) doiDrop.value = current.doinhap;
    loadChaMe();
  }

  /* ================== CHA/MẸ ================== */
  
function loadChaMe() {
  const chi = val("id-chinhap-form");
  const doi = Number(val("id-doinhap-form"));
  const chaDrop = id("id-cha");
  const meDrop  = id("id-me");

  if (!chaDrop || !meDrop) {
    console.warn("Drop cha/mẹ chưa tồn tại trong DOM");
    return;
  }

  // Reset dropdown
  chaDrop.innerHTML = `<option value="">-- Cha --</option>`;
  meDrop.innerHTML  = `<option value="">-- Mẹ --</option>`;
  if (!chi || doi <= 0) return;

  // Populate Cha: tất cả người cùng chi, đời = doi-1
  const chaList = people.filter(p => p.chinhap === chi && Number(p.doinhap) === doi - 1);
  chaList.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;       // lưu id của cha
    opt.textContent = c.hovaten;
    chaDrop.appendChild(opt);
  });

  // Khi chọn cha, populate Mẹ: tất cả vợ của cha
  chaDrop.onchange = () => {
    meDrop.innerHTML = `<option value="">-- Mẹ --</option>`;
    const selectedChaId = chaDrop.value;
    if (!selectedChaId) return;

    const cha = people.find(p => p.id === selectedChaId);
    if (!cha?.vo) return;

    cha.vo.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.tenvo;  // lưu tên vợ
      opt.textContent = v.tenvo;
      meDrop.appendChild(opt);
    });

    // Nếu đang sửa người, giữ nguyên giá trị mẹ đã chọn
    if (current?.me) meDrop.value = current.me;
  };

  // Nếu đang sửa người, set sẵn giá trị cha
  if (current?.cha) chaDrop.value = current.cha;
}


  /* ================== TÌM KIẾM ================== */
  async function initChiSearch(){
    const chiDrop = id("id-chinhap");
    chiDrop.innerHTML = `<option value="">-- Chọn Chi --</option>`;
    const chiList = await getChi();
    chiList.forEach(c=>{
      chiDrop.insertAdjacentHTML("beforeend", `<option value="${c.name}">${c.name}</option>`);
    });
    chiDrop.onchange = ()=>{
      refreshDoiSearch();
      refreshTenSearch();
    };
    id("id-doinhap").onchange = refreshTenSearch;
    id("btnTim").onclick = searchPerson;
  }

  function refreshDoiSearch(){
    const chi = val("id-chinhap");
    const doiDrop = id("id-doinhap");
    doiDrop.innerHTML = `<option value="">-- Chọn Đời --</option>`;
    if(!chi) return;
    const doiList = [...new Set(people.filter(p=>p.chinhap===chi).map(p=>p.doinhap))].sort((a,b)=>a-b);
    doiList.forEach(d=>doiDrop.insertAdjacentHTML("beforeend", `<option value="${d}">Đời ${d}</option>`));
  }

  function refreshTenSearch(){
    const chi = val("id-chinhap");
    const doi = val("id-doinhap");
    const tenDrop = id("id-tennhap");
    tenDrop.innerHTML = `<option value="">-- Chọn Tên --</option>`;
    let list = people;
    if(chi) list = list.filter(p=>p.chinhap===chi);
    if(doi) list = list.filter(p=>String(p.doinhap)===doi);
    list.forEach(p=>{
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.hovaten;
      tenDrop.appendChild(option);
    });
  }

  function searchPerson(){
    const chi = val("id-chinhap");
    const doi = val("id-doinhap");
    const tenId = val("id-tennhap");

    const results = people.filter(p=>{
      let ok = true;
      if(chi) ok = ok && p.chinhap === chi;
      if(doi) ok = ok && String(p.doinhap) === doi;
      if(tenId) ok = ok && String(p.id) === tenId;
      return ok;
    });

    if(results.length === 0){ toast("Không tìm thấy người"); return; }

    fillForm(results[0]);

    const tree = id("tree");
    tree.innerHTML = "";
    results.forEach(p=>{
      const d=document.createElement("div");
      d.textContent=`${p.chinhap} – Đời ${p.doinhap} – ${p.hovaten}`;
      d.onclick = ()=>fillForm(p);
      tree.appendChild(d);
    });
  }

  /* ================== FILL FORM ================== */
  
function fillForm(p){
  current = p;
  set("id-hovaten", p.hovaten);
  set("id-thuonggoi", p.thuonggoi);
  set("id-chinhap-form", p.chinhap);
  set("id-doinhap-form", p.doinhap);
  set("id-nghiep", p.nghiep);
  set("id-sinh", p.sinh);
  set("id-mat", p.mat);
  set("id-motang", p.motang);
  set("id-map", p.map);
  set("id-ghichu", p.ghichu);
  set("id-sinhha", p.sinhha);
  previewImage(p.anh);

  // Vợ / con
  id("vo-container").innerHTML = "";
  (p.vo || []).forEach(addVoForm);

  // ------------------------
  // CHA / MẸ
  // ------------------------
  // 1. Populate cha
  const chi = p.chinhap;
  const doi = Number(p.doinhap);
  const chaDrop = id("id-cha");
  const meDrop  = id("id-me");

  chaDrop.innerHTML = `<option value="">-- Cha --</option>`;
  meDrop.innerHTML  = `<option value="">-- Mẹ --</option>`;

  const chaList = people.filter(x => x.chinhap===chi && Number(x.doinhap)===doi-1);
  chaList.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.hovaten;
    chaDrop.appendChild(opt);
  });

  // 2. Set cha
  if(p.cha) chaDrop.value = p.cha;

  // 3. Populate mẹ dựa trên cha đã chọn
  if(p.cha){
    const chaObj = people.find(x=>x.id===p.cha);
    if(chaObj?.vo){
      chaObj.vo.forEach(v=>{
        const opt = document.createElement("option");
        opt.value = v.tenvo;
        opt.textContent = v.tenvo;
        meDrop.appendChild(opt);
      });
    }
  }

  // 4. Set mẹ
  if(p.me) meDrop.value = p.me;
}


  /* ================== TREE ================== */
  function renderTree(){
  const box = id("tree");
  box.innerHTML = "";

  const chiList = [...new Set(people.map(p => p.chinhap))];

  chiList.forEach(chi => {
    const chiDiv = document.createElement("div");
    chiDiv.textContent = chi;
    chiDiv.className = "chi-item";
    chiDiv.dataset.open = "0";

    chiDiv.onclick = (e) => {
      e.stopPropagation();
      toggleChiTree(chi, chiDiv);
    };

    box.appendChild(chiDiv); // ✅ SỬA Ở ĐÂY
  });
}


  function renderDoiTree(chi, parentDiv){
  const doiList = [...new Set(
    people.filter(p=>p.chinhap===chi).map(p=>p.doinhap)
  )].sort((a,b)=>a-b);

  parentDiv.querySelectorAll(".doi-list").forEach(e=>e.remove());

  doiList.forEach(doi=>{
    const doiDiv = document.createElement("div");
    doiDiv.textContent = "Đời " + doi;
    doiDiv.className = "doi-list";
    doiDiv.dataset.open = "0"; // đóng mặc định

    doiDiv.onclick = (e)=>{
      e.stopPropagation();
      toggleTenTree(chi, doi, doiDiv);
    };

    parentDiv.appendChild(doiDiv);
  });
}


  function renderTenTree(chi, doi, parentDiv){
    parentDiv.querySelectorAll(".ten-list").forEach(e=>e.remove());
    const tenList = people.filter(p=>p.chinhap===chi && p.doinhap===doi);
    tenList.forEach(p=>{
      const tenDiv = document.createElement("div");
      tenDiv.textContent = p.hovaten;
      tenDiv.className="ten-list";
      tenDiv.style.paddingLeft="40px";
      tenDiv.onclick = (e)=>{ e.stopPropagation(); fillForm(p); };
      parentDiv.appendChild(tenDiv);
    });
  }

function toggleTenTree(chi, doi, doiDiv){
  const isOpen = doiDiv.dataset.open === "1";

  // Nếu đang mở → thu lại
  if(isOpen){
    doiDiv.querySelectorAll(".ten-list").forEach(e=>e.remove());
    doiDiv.dataset.open = "0";
    doiDiv.classList.remove("open");
    return;
  }

  // Đóng các đời khác (gọn gàng)
  doiDiv.parentElement.querySelectorAll(".doi-list").forEach(d=>{
    d.dataset.open = "0";
    d.classList.remove("open");
    d.querySelectorAll(".ten-list").forEach(e=>e.remove());
  });

  // Bung danh sách tên
  const tenList = people.filter(
    p=>p.chinhap===chi && p.doinhap===doi
  );

  tenList.forEach(p=>{
    const tenDiv = document.createElement("div");
    tenDiv.textContent = p.hovaten;
    tenDiv.className = "ten-list";
    tenDiv.onclick = (e)=>{
      e.stopPropagation();
      fillForm(p);
    };
    doiDiv.appendChild(tenDiv);
  });

  doiDiv.dataset.open = "1";
  doiDiv.classList.add("open");
}


function toggleChiTree(chi, chiDiv){
  const isOpen = chiDiv.dataset.open === "1";

  // Nếu đang mở → thu lại
  if(isOpen){
    chiDiv.querySelectorAll(".doi-list").forEach(e=>e.remove());
    chiDiv.dataset.open = "0";
    chiDiv.classList.remove("open");
    return;
  }

  // Đóng các chi khác
  chiDiv.parentElement.querySelectorAll(".chi-item").forEach(c=>{
    c.dataset.open = "0";
    c.classList.remove("open");
    c.querySelectorAll(".doi-list").forEach(e=>e.remove());
  });

  // Bung đời
  renderDoiTree(chi, chiDiv);

  chiDiv.dataset.open = "1";
  chiDiv.classList.add("open");
}

  /* ================== AVATAR ================== */
  function bindAvatarPreview(){
    id("id-anh").onchange = (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = function(ev){
        previewImage(ev.target.result);
      };
      reader.readAsDataURL(file);
    };
  }

  function previewImage(url){
    id("previewAnh").src=url||"";
    if(current) current.anh=url||"";
  }

  /* ================== BUTTONS ================== */
  function bindButtons(){
    id("btnThem").onclick = async ()=>{
      const data = {};
      readForm(data);
      await addPerson(data);
      toast("Đã thêm người");
      await loadPeople();
      clearForm();
    };
    id("btnLuu").onclick = async ()=>{
      if(!current?.id) return toast("Chưa chọn người");
      readForm(current);
      await updatePerson(current.id,current);
      toast("Đã lưu");
      await loadPeople();
      clearForm();
    };
    id("btnXoa").onclick = async ()=>{
      if(!current?.id) return;
      if(!confirm("Xóa người này?")) return;
      await deletePerson(current.id);
      toast("Đã xóa");
      await loadPeople();
      clearForm();
    };
    id("btnThemVo").onclick = ()=>addVoForm();
    id("btnTim").onclick = searchPerson;
  }

  function readForm(p){
    p.hovaten   = val("id-hovaten");
    p.thuonggoi = val("id-thuonggoi");
    p.chinhap   = val("id-chinhap-form");
    p.doinhap   = Number(val("id-doinhap-form"));
    p.nghiep    = val("id-nghiep");
    p.sinh      = val("id-sinh");
    p.mat       = val("id-mat");
    p.motang    = val("id-motang");
    p.map       = val("id-map");
    p.ghichu    = val("id-ghichu");
    p.sinhha    = val("id-sinhha");
    p.cha       = val("id-cha");
    p.me        = val("id-me");


    p.vo = [];
    document.querySelectorAll(".vo-form").forEach(v=>{
      const vo = {
        tenvo: v.querySelector(".tenvo").value,
        goivo: v.querySelector(".goivo")?.value,
        quevo: v.querySelector(".quevo")?.value,
        chavo: v.querySelector(".chavo")?.value,
        mevo: v.querySelector(".mevo")?.value,
        sinhvo: v.querySelector(".sinhvo")?.value,
        matvo: v.querySelector(".matvo")?.value,
        movo: v.querySelector(".movo")?.value,
        mapvo: v.querySelector(".mapvo")?.value,
        ghichuvo: v.querySelector(".ghichuvo")?.value,
        con: []
      };
      v.querySelectorAll(".con").forEach(c=>vo.con.push(c.value));
      p.vo.push(vo);
    });
  }

  /* ================== VỢ / CON ================== */
  window.addVoForm = function(v = {}) {
  const div = document.createElement("div");
  div.className = "vo-form";

  div.innerHTML = `
    <div class="buttons">
      <b>Vợ</b>
      <button type="button" class="del-vo btn-xoa-vo">Xóa vợ</button>
    </div>

    <div class="row"><label>Họ tên</label><input class="tenvo" value="${v.tenvo||""}"></div>
    <div class="row"><label>Thường gọi</label><input class="goivo" value="${v.goivo||""}"></div>
    <div class="row"><label>Nguyên quán</label><input class="quevo" value="${v.quevo||""}"></div>
    <div class="row"><label>Cha</label><input class="chavo" value="${v.chavo||""}"></div>
    <div class="row"><label>Mẹ</label><input class="mevo" value="${v.mevo||""}"></div>
    <div class="row"><label>Sinh</label><input class="sinhvo" value="${v.sinhvo||""}"></div>
    <div class="row"><label>Mất</label><input class="matvo" value="${v.matvo||""}"></div>
    <div class="row"><label>Mộ táng</label><input class="movo" value="${v.movo||""}"></div>
    <div class="row"><label>Maps</label><input class="mapvo" value="${v.mapvo||""}"></div>

    <div class="row full">
      <label>Ghi chú</label>
      <textarea class="ghichuvo">${v.ghichuvo||""}</textarea>
    </div>

    <div class="con-box"></div>

<div class="buttons">
  <button type="button" class="btn-them-con">+ Thêm con</button>
</div>

    <hr>
  `;

  div.querySelector(".del-vo").onclick = () => div.remove();
  div.querySelector(".btn-them-con").onclick = () => addConForm(div);

  id("vo-container").appendChild(div);
  (v.con || []).forEach(c => addConForm(div, c));
};


  function addConForm(voDiv, ten = "") {
  const d = document.createElement("div");
  d.className = "row";
  d.innerHTML = `
    <label>Con</label>
    <div style="display:flex; gap:6px;">
      <input class="con" value="${ten}" placeholder="Tên con">
      <button type="button" class="btn-xoa-con">X</button>
    </div>
  `;
  d.querySelector("button").onclick = () => d.remove();
  voDiv.querySelector(".con-box").appendChild(d);
}

  /* ================== UTILS ================== */
  const id=i=>document.getElementById(i);
  const val=i=>id(i)?.value||"";
  const set=(i,v)=>id(i)&&(id(i).value=v||"");

  function clearForm(){
    document.querySelectorAll("input,textarea").forEach(i=>i.value="");
    id("vo-container").innerHTML="";
    id("previewAnh").src="";
    current=null;
  }

  function toast(msg){
    const d=document.createElement("div");
    d.textContent=msg;
    d.className="toast";
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),2000);
  }

})();
