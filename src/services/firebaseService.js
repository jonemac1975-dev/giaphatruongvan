import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, push, set, remove, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { firebaseConfig } from "../config.js";

// ===== INIT FIREBASE =====
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
const storage = getStorage(app);

// ===== DATABASE =====
export async function firebaseGet(path){
  const snap = await get(ref(db, path));
  return snap.exists() ? snap.val() : null;
}
export async function firebasePush(path, data){
  const newRef = push(ref(db, path));
  await set(newRef, data);
  return newRef.key; // 🔑 trả về id firebase
}

export async function firebaseSet(path, data){
  return await set(ref(db, path), data);
}
export async function firebaseDelete(path){
  return await remove(ref(db, path));
}

// ===== STORAGE =====
export async function firebaseUpload(path, file){
  const storageRef = sRef(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
export async function firebaseDeleteFile(path){
  const storageRef = sRef(storage, path);
  return await deleteObject(storageRef);
}

// ===== HASH SHA-256 =====
export async function hashPass(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2,"0"))
    .join("");
}

// ===== CHECK PASSWORD =====
export async function checkPassword(chi, password){
  const path = `config/password/${chi}`;
  const snap = await get(ref(db, path));
  if(!snap.exists()) return false;
  const passHashDB = String(snap.val()).trim();
  const passHashIn = await hashPass(String(password).trim());
  return passHashDB === passHashIn;
}

// =================== CHANGE PASSWORD ===================
// Đổi pass cho admin + 5 chi
export async function updatePassword(chi, newPass) {
  if (!chi || !newPass) return false;

  try {
    const hash = await hashPass(newPass.trim());
    const updates = {};
    updates[`config/password/${chi}`] = hash;

    // modular SDK update
    await update(ref(db), updates);

    return true;
  } catch (err) {
    console.error("updatePassword error:", err);
    return false;
  }
}
