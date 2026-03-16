import {
  getBooks,
  addBook,
  updateBook,
  deleteBook
} from "/src/services/contentService.js";

let inited = false;
let currentEditId = null;

window.loadTab9 = async function () {
  if (inited) return;
  inited = true;

  /* ======================
     DOM
  ====================== */
  const $ = id => document.getElementById(id);

  const bookTitle   = $("book-title");
  const bookSummary = $("book-summary");
  const bookContent = $("book-content");
  const bookLink    = $("book-link");

  const bookAdd   = $("book-add");
  const bookSave  = $("book-save");
  const bookClear = $("book-clear");
  const bookList  = $("book-list");

  const btnInsertImage = $("btn-insert-image");
  const btnInsertPDF   = $("btn-insert-pdf");
  const btnInsertVideo = $("btn-insert-video");
  const btnInsertAudio = $("btn-insert-audio");
  const imageInput     = $("book-image");

  if (!bookTitle || !bookContent || !bookAdd || !bookList) {
    console.error("Tab9 DOM missing");
    return;
  }

  /* ======================
     EDITOR UTILS
  ====================== */
  function insertHTML(html) {
    bookContent.focus();

    if (document.queryCommandSupported("insertHTML")) {
      document.execCommand("insertHTML", false, html);
    } else {
      bookContent.innerHTML += html;
    }
  }

  function cleanWordHTML(html) {
    return html
      .replace(/style="[^"]*"/gi, "")
      .replace(/class="[^"]*"/gi, "")
      .replace(/<o:p>\s*<\/o:p>/g, "")
      .replace(/<\/?span[^>]*>/gi, "");
  }

  bookContent.addEventListener("paste", e => {
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
  const btnInsertFlip = $("btn-insert-flip");

btnInsertFlip?.addEventListener("click", () => {

  let url = prompt("Dán link FlipHTML5 hoặc PDF Google Drive:");
  if (!url) return;

  // nếu là Google Drive
  if (url.includes("drive.google.com")) {
    const id = url.match(/\/d\/([^/]+)/)?.[1];
    if (!id) return alert("Link Drive không hợp lệ");

    url = `https://drive.google.com/file/d/${id}/preview`;
  }

  insertHTML(`
    <div style="margin:20px 0">
      <iframe
        src="${url}"
        style="width:100%;height:700px;border:none"
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

btnInsertVideo?.addEventListener("click", () => {
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
});


  
  /* ======================
   INSERT AUDIO
====================== */
btnInsertAudio?.addEventListener("click", () => {
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
});



  /* ======================
     LOAD LIST
  ====================== */
  async function loadBook() {
    bookList.innerHTML = "";
    const data = await getBooks();
    if (!data?.length) return;

    data.sort((a, b) => b.createdAt - a.createdAt);

    data.forEach((it, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${it.title || ""}</td>
        <td>${it.createdAt ? new Date(it.createdAt).toLocaleDateString("vi-VN") : ""}</td>
        <a href="/notice.html?type=book&id=${it.id}" target="_blank">Xem</a>
        <td>
          <button class="edit">Sửa</button>
          <button class="del">Xóa</button>
        </td>
      `;

      tr.querySelector(".edit").onclick = () => editBook(it);
      tr.querySelector(".del").onclick  = () => removeBook(it.id);

      bookList.appendChild(tr);
    });
  }

  /* ======================
     CRUD
  ====================== */
  function editBook(it) {
    bookTitle.value   = it.title || "";
    bookSummary.value = it.summary || "";
    bookContent.innerHTML = it.content || "";
    bookLink.value    = it.link || "";

    currentEditId = it.id;
    bookAdd.disabled  = true;
    bookSave.disabled = false;
  }

  async function removeBook(id) {
    if (!confirm("Xóa thông báo này?")) return;
    await deleteBook(id);
    loadBook();
  }

  bookAdd.onclick = async () => {
    const title = bookTitle.value.trim();
    if (!title) return alert("Nhập tiêu đề");

    await updateBook("giapha", {
  title,
  summary: bookSummary.value.trim(),
  content: bookContent.innerHTML,
  link: bookLink.value.trim(),
  status: 1,
  createdAt: Date.now()
});

    clearForm();
    loadBook();
  };

  bookSave.onclick = async () => {
    if (!currentEditId) return;

    await updateBook(currentEditId, {
      title: bookTitle.value.trim(),
      summary: bookSummary.value.trim(),
      content: bookContent.innerHTML,
      link: bookLink.value.trim(),
      updatedAt: Date.now()
    });

    clearForm();
    loadBook();
  };

  function clearForm() {
    bookTitle.value = "";
    bookSummary.value = "";
    bookContent.innerHTML = "";
    bookLink.value = "";

    currentEditId = null;
    bookAdd.disabled = false;
    bookSave.disabled = true;
  }

  bookClear.onclick = clearForm;

  bookSave.disabled = true;
  loadBook();
};
