// change-pass.js
import { checkPassword, updatePassword } from "/src/services/firebaseService.js";

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("change-pass-modal");
  const btnSave = document.getElementById("cp-save");
  const btnCancel = document.getElementById("cp-cancel");

  const selChi = document.getElementById("cp-chi");
  const inpOld = document.getElementById("cp-old");
  const inpNew = document.getElementById("cp-new");
  const inpNew2 = document.getElementById("cp-new2");

  // ===== Hàm mở modal =====
  window.openChangePass = () => {
    modal.classList.remove("hidden");
    selChi.value = "";
    inpOld.value = "";
    inpNew.value = "";
    inpNew2.value = "";
  };

  // ===== Hủy =====
  btnCancel.onclick = () => {
    modal.classList.add("hidden");
  };

  // ===== Lưu pass mới =====
  btnSave.onclick = async () => {
    const chi = selChi.value;
    const oldPass = inpOld.value.trim();
    const newPass = inpNew.value.trim();
    const newPass2 = inpNew2.value.trim();

    if (!chi) {
      alert("Vui lòng chọn chi/admin!");
      return;
    }
    if (!oldPass || !newPass || !newPass2) {
      alert("Vui lòng điền đầy đủ các trường!");
      return;
    }
    if (newPass !== newPass2) {
      alert("Mật khẩu mới không trùng khớp!");
      return;
    }

    // kiểm tra pass cũ
    const ok = await checkPassword(chi, oldPass);
    if (!ok) {
      alert("Mật khẩu hiện tại sai!");
      return;
    }

    // cập nhật pass mới
    const success = await updatePassword(chi, newPass);
    if (success) {
      alert(`Đổi mật khẩu ${chi} thành công!`);
      modal.classList.add("hidden");
    } else {
      alert("Đổi mật khẩu thất bại, thử lại sau!");
    }
  };
});
