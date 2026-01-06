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

  // ===== DOM =====
  const noticeTitle   = document.getElementById("notice-title");
  const noticeSummary = document.getElementById("notice-summary");
  const noticeContent = document.getElementById("notice-content");
  const noticeLink    = document.getElementById("notice-link");

  const noticeAdd   = document.getElementById("notice-add");
  const noticeSave  = document.getElementById("notice-save");
  const noticeClear = document.getElementById("notice-clear");

  const noticeList  = document.getElementById("notice-list");

  // ===== CHÈN ẢNH =====
  const btnInsertImage = document.getElementById("btn-insert-image");
  const imageInput    = document.getElementById("notice-image");

  if (
    !noticeTitle || !noticeSummary || !noticeContent ||
    !noticeLink || !noticeAdd || !noticeSave ||
    !noticeClear || !noticeList
  ) {
    console.error("Tab3 elements missing");
    return;
  }

  /* ==============================
     CHÈN ẢNH VÀO NỘI DUNG
  ============================== */
  if (btnInsertImage && imageInput) {
    btnInsertImage.onclick = () => imageInput.click();

    imageInput.onchange = () => {
      const file = imageInput.files[0];
      if (!file) return;

      // quy ước: ảnh đã up sẵn trong /store/
      const imgPath = `./store/${file.name}`;

      insertAtCursor(
        noticeContent,
        `\n<img src="${imgPath}" class="center">\n`
      );

      imageInput.value = "";
    };
  }

  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end   = textarea.selectionEnd;
    const value = textarea.value;

    textarea.value =
      value.substring(0, start) +
      text +
      value.substring(end);

    textarea.selectionStart =
    textarea.selectionEnd = start + text.length;

    textarea.focus();
  }

  /* ==============================
     LOAD LIST
  ============================== */
  async function loadNotices() {
    noticeList.innerHTML = "";
    const notices = await getNotices();
    if (!notices.length) return;

    notices
      .sort((a, b) => b.createdAt - a.createdAt)
      .forEach((it, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${it.title || ""}</td>
          <td>${it.createdAt ? new Date(it.createdAt).toLocaleDateString("vi-VN") : ""}</td>
          <td>
            <a href="/notice.html?id=${it.id}" target="_blank">Xem</a>
          </td>
          <td>
            <button class="edit">Sửa</button>
            <button class="del">Xóa</button>
          </td>
        `;

        // ===== SỬA =====
        tr.querySelector(".edit").onclick = () => {
          noticeTitle.value   = it.title || "";
          noticeSummary.value = it.summary || "";
          noticeContent.value = it.content || "";
          noticeLink.value    = it.link || "";

          currentEditId = it.id;
          noticeAdd.disabled  = true;
          noticeSave.disabled = false;
        };

        // ===== XÓA =====
        tr.querySelector(".del").onclick = async () => {
          if (!confirm("Xóa thông báo này?")) return;
          await deleteNotice(it.id);
          await loadNotices();
        };

        noticeList.appendChild(tr);
      });
  }

  /* ==============================
     THÊM MỚI
  ============================== */
  noticeAdd.onclick = async () => {
    if (currentEditId) return;

    const title   = noticeTitle.value.trim();
    const summary = noticeSummary.value.trim();
    const content = noticeContent.value.trim();
    const link    = noticeLink.value.trim();

    if (!title) return alert("Nhập tiêu đề thông báo");

    await addNotice({
      title,
      summary,
      content,
      link,
      status: 1,
      createdAt: Date.now()
    });

    clearForm();
    await loadNotices();
  };

  /* ==============================
     LƯU (UPDATE)
  ============================== */
  noticeSave.onclick = async () => {
    if (!currentEditId) return;

    const title   = noticeTitle.value.trim();
    const summary = noticeSummary.value.trim();
    const content = noticeContent.value.trim();
    const link    = noticeLink.value.trim();

    if (!title) return alert("Nhập tiêu đề thông báo");

    await updateNotice(currentEditId, {
      title,
      summary,
      content,
      link,
      status: 1,
      createdAt: Date.now()
    });

    clearForm();
    await loadNotices();
  };

  /* ==============================
     CLEAR FORM
  ============================== */
  function clearForm() {
    noticeTitle.value   = "";
    noticeSummary.value = "";
    noticeContent.value = "";
    noticeLink.value    = "";

    currentEditId = null;
    noticeAdd.disabled  = false;
    noticeSave.disabled = true;
  }

  noticeClear.onclick = clearForm;

  // init
  noticeSave.disabled = true;
  await loadNotices();
};
