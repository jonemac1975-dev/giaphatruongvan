import { firebaseGet } from "../../../src/services/firebaseService.js";

const titleEl   = document.getElementById("title");
const dateEl    = document.getElementById("date");
const contentEl = document.getElementById("content");

/* =========================
   GET PARAM
========================= */
const params = new URLSearchParams(window.location.search);

const id   = params.get("id");
const type = params.get("type") || "notice"; 
// mặc định là notice nếu không truyền type

if (!id) {
  titleEl.innerText = "Không tìm thấy nội dung";
} else {
  loadNotice();
}

/* =========================
   LOAD DATA
========================= */
async function loadNotice() {
  try {

    const path = `content/${type}/${id}`;

    const data = await firebaseGet(path);

    if (!data || data.status === 0) {
      titleEl.innerText = "Nội dung không tồn tại";
      contentEl.innerText = "";
      return;
    }

    /* ===== TITLE ===== */
    titleEl.innerText = data.title || "";

    /* ===== DATE ===== */
 //  dateEl.innerText = data.createdAt
//     ? new Date(data.createdAt).toLocaleDateString("vi-VN")
  //   : "";

    /* ===== CONTENT ===== */
    if (data.content) {

      // cho phép HTML (img, iframe, video...)
      contentEl.innerHTML = data.content.replace(/\n/g, "<br>");

    }
    else if (data.link) {

      contentEl.innerHTML = `
        <p>
          <a href="${data.link}" target="_blank">
            ${data.link}
          </a>
        </p>
      `;

    }
    else {

      contentEl.innerText = "Không có nội dung";

    }

  } catch (err) {

    console.error("Load notice error:", err);

    titleEl.innerText = "Lỗi tải dữ liệu";
    contentEl.innerText = "";

  }
}