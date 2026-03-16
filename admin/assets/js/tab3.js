import {
  getNotices,
  addNotice,
  updateNotice,
  deleteNotice
} from "/src/services/contentService.js";

let inited = false;
let currentEditId = null;

window.loadTab3 = async function () {
  if (inited) return;
  inited = true;

  /* ======================
     DOM
  ====================== */
  const $ = id => document.getElementById(id);

  const noticeTitle   = $("notice-title");
  const noticeSummary = $("notice-summary");
  const noticeContent = $("notice-content");
  const noticeLink    = $("notice-link");

  const noticeAdd   = $("notice-add");
  const noticeSave  = $("notice-save");
  const noticeClear = $("notice-clear");
  const noticeList  = $("notice-list");

  const btnInsertImage = $("btn-insert-image");
  const btnInsertPDF   = $("btn-insert-pdf");
  const btnInsertVideo = $("btn-insert-video");
  const btnInsertAudio = $("btn-insert-audio");
  const imageInput     = $("notice-image");

  if (!noticeTitle || !noticeContent || !noticeAdd || !noticeList) {
    console.error("Tab3 DOM missing");
    return;
  }

  /* ======================
     EDITOR UTILS
  ====================== */
  function insertHTML(html) {
    noticeContent.focus();

    if (document.queryCommandSupported("insertHTML")) {
      document.execCommand("insertHTML", false, html);
    } else {
      noticeContent.innerHTML += html;
    }
  }

  function cleanWordHTML(html) {
    return html
      .replace(/style="[^"]*"/gi, "")
      .replace(/class="[^"]*"/gi, "")
      .replace(/<o:p>\s*<\/o:p>/g, "")
      .replace(/<\/?span[^>]*>/gi, "");
  }

  noticeContent.addEventListener("paste", e => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text/html")
      || (e.clipboardData || window.clipboardData).getData("text/plain");
    insertHTML(cleanWordHTML(text));
  });

  /* ======================
     INSERT IMAGE
  ====================== */
  btnInsertImage?.addEventListener("click", () => imageInput.click());

imageInput?.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    insertHTML(`
      <div class="media image" style="margin:10px 0;text-align:center">
        <img src="${e.target.result}" style="max-width:100%;height:auto" />
      </div>
    `);
  };
  reader.readAsDataURL(file);

  imageInput.value = "";
});


  /* ======================
     INSERT PDF / FLIP
  ====================== */
  btnInsertPDF?.addEventListener("click", () => {
  let url = prompt("Dán link PDF (Google Drive / FlipHTML5):");
  if (!url) return;

  // Google Drive → convert sang preview
  if (url.includes("drive.google.com")) {
    const id = url.match(/\/d\/([^/]+)/)?.[1];
    if (!id) return alert("Link Drive không hợp lệ");
    url = `https://drive.google.com/file/d/${id}/preview`;
  }

  insertHTML(`
    <div class="media pdf" style="margin:12px 0">
      <iframe
        src="${url}"
        style="width:100%;height:600px;border:0"
        loading="lazy">
      </iframe>
    </div>
  `);
});

  /* ======================
     INSERT VIDEO
  ====================== */
  function getYoutubeId(url) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&]+)/);
    return m ? m[1] : null;
  }

 btnInsertVideo.onclick = () => {
  const url = prompt("Dán link MP4 Google Drive hoặc YouTube:");
  if (!url) return;

  // YouTube
  let ytId = null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&]+)/);
  if (ytMatch) ytId = ytMatch[1];

  if (ytId) {
    insertHTML(`
      <div class="media video" style="margin:16px 0">
        <iframe
          src="https://www.youtube.com/embed/${ytId}"
          style="width:100%;aspect-ratio:16/9"
          allowfullscreen>
        </iframe>
      </div>
    `);
    return;
  }

  // Drive MP4
  const m = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
  if (!m) return alert("Link không hợp lệ");

  insertHTML(`
    <div class="media video" style="margin:16px 0;text-align:center">
      <iframe
        src="https://drive.google.com/file/d/${m[1]}/preview"
        style="width:90%;max-width:900px;height:420px;border:none"
        allow="autoplay">
      </iframe>
    </div>
  `);
};


  
  /* ======================
   INSERT AUDIO
====================== */
btnInsertAudio.onclick = () => {
  const url = prompt("Dán link MP3 Google Drive:");
  if (!url) return;

  const m = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
  if (!m) return alert("Link không hợp lệ");

  insertHTML(`
    <div class="media audio" style="margin:12px 0;text-align:center">
      <iframe
        src="https://drive.google.com/file/d/${m[1]}/preview"
        style="width:360px;height:60px;border:none"
        allow="autoplay">
      </iframe>
    </div>
  `);
};



  /* ======================
     LOAD LIST
  ====================== */
  async function loadNotices() {
    noticeList.innerHTML = "";
    const data = await getNotices();
    if (!data?.length) return;

    data.sort((a, b) => b.createdAt - a.createdAt);

    data.forEach((it, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${it.title || ""}</td>
        <td>${it.createdAt ? new Date(it.createdAt).toLocaleDateString("vi-VN") : ""}</td>
        <td><a href="/notice.html?id=${it.id}" target="_blank">Xem</a></td>
        <td>
          <button class="edit">Sửa</button>
          <button class="del">Xóa</button>
        </td>
      `;

      tr.querySelector(".edit").onclick = () => editNotice(it);
      tr.querySelector(".del").onclick  = () => removeNotice(it.id);

      noticeList.appendChild(tr);
    });
  }

  /* ======================
     CRUD
  ====================== */
  function editNotice(it) {
    noticeTitle.value   = it.title || "";
    noticeSummary.value = it.summary || "";
    noticeContent.innerHTML = it.content || "";
    noticeLink.value    = it.link || "";

    currentEditId = it.id;
    noticeAdd.disabled  = true;
    noticeSave.disabled = false;
  }

  async function removeNotice(id) {
    if (!confirm("Xóa thông báo này?")) return;
    await deleteNotice(id);
    loadNotices();
  }

  noticeAdd.onclick = async () => {
    const title = noticeTitle.value.trim();
    if (!title) return alert("Nhập tiêu đề");

    await addNotice({
      title,
      summary: noticeSummary.value.trim(),
      content: noticeContent.innerHTML,
      link: noticeLink.value.trim(),
      status: 1,
      createdAt: Date.now()
    });

    clearForm();
    loadNotices();
  };

  noticeSave.onclick = async () => {
    if (!currentEditId) return;

    await updateNotice(currentEditId, {
      title: noticeTitle.value.trim(),
      summary: noticeSummary.value.trim(),
      content: noticeContent.innerHTML,
      link: noticeLink.value.trim(),
      updatedAt: Date.now()
    });

    clearForm();
    loadNotices();
  };

  function clearForm() {
    noticeTitle.value = "";
    noticeSummary.value = "";
    noticeContent.innerHTML = "";
    noticeLink.value = "";

    currentEditId = null;
    noticeAdd.disabled = false;
    noticeSave.disabled = true;
  }

  noticeClear.onclick = clearForm;

  noticeSave.disabled = true;
  loadNotices();
};
