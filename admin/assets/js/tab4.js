import {
  addEventImage,
  getEventImages,
  deleteEventImage
} from "/src/services/contentService.js";


let inited = false;

window.loadTab4 = async function () {
  if (inited) return;
  inited = true;

  const titleEl = document.getElementById("event-title");
  const dateEl  = document.getElementById("event-date");
  const linkEl  = document.getElementById("event-link");
  const fileEl  = document.getElementById("event-file");
  const addBtn  = document.getElementById("event-add");
  const listEl  = document.getElementById("event-list");

  if (!titleEl || !dateEl || !fileEl || !addBtn || !listEl) {
    console.error("Tab4 elements missing");
    return;
  }

  async function loadEvents() {
    listEl.innerHTML = "";
    const items = await getEventImages();
    if (!items.length) return;

    items
      .sort((a, b) => b.date - a.date)
      .forEach((it, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td><img src="${it.image}" style="height:60px"></td>
          <td>${it.title || ""}</td>
          <td>${new Date(it.date).toLocaleDateString("vi-VN")}</td>
          <td><button>Xoá</button></td>
        `;

        tr.querySelector("button").onclick = async () => {
          if (!confirm("Xóa ảnh sự kiện này?")) return;
          await deleteEventImage(it.id);
          loadEvents();
        };

        listEl.appendChild(tr);
      });
  }

  addBtn.onclick = async () => {
    const file = fileEl.files[0];
    if (!file) return alert("Chưa chọn ảnh");

    await addEventImage({
      title: titleEl.value.trim(),
      link : linkEl.value.trim(),
      file,
      date: new Date(dateEl.value).getTime(),
      createdAt: Date.now()
    });

    titleEl.value = "";
    linkEl.value  = "";
    dateEl.value  = "";
    fileEl.value  = "";

    loadEvents();
  };

  loadEvents();
};
