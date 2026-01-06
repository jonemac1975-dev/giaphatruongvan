import { firebaseGet } from "../../../src/services/firebaseService.js";

const titleEl   = document.getElementById("title");
const dateEl    = document.getElementById("date");
const contentEl = document.getElementById("content");

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  titleEl.innerText = "Không tìm thấy thông báo";
} else {
  loadNotice();
}

async function loadNotice() {
  try {
    const data = await firebaseGet(`content/notice/${id}`);

    if (!data || data.status === 0) {
      titleEl.innerText = "Thông báo không tồn tại";
      return;
    }

    // ===== TITLE =====
    titleEl.innerText = data.title || "";

    // ===== DATE =====
    dateEl.innerText = data.createdAt
      ? new Date(data.createdAt).toLocaleDateString("vi-VN")
      : "";

    // ===== CONTENT =====
    if (data.content) {
      // ⚠️ CHO PHÉP HTML → hiển thị <img>, <p>, <br>...
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
    console.error(err);
    titleEl.innerText = "Lỗi tải thông báo";
    contentEl.innerText = "";
  }
}
