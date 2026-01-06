// /src/services/contentService.js
import { 
  firebasePush, 
  firebaseGet, 
  firebaseDelete, 
  firebaseUpload, 
  firebaseDeleteFile, 
  firebaseSet 
} from "./firebaseService.js";

/* ==================================================
   TAB 1: CẬP NHẬT CÁ NHÂN
================================================== */
const BASE_PEOPLE = "people";

export async function addPerson(data){
  const ref = await firebasePush(BASE_PEOPLE, data);
  return { id: ref.key, ...data };
}

export async function getPeople(){ 
  const snap = await firebaseGet(BASE_PEOPLE);
  if (!snap) return [];
  return Object.entries(snap).map(([id, v]) => ({ id, ...v }));
}

export async function updatePerson(id, data){ 
  const { id: _remove, ...pure } = data;
  return await firebaseSet(`${BASE_PEOPLE}/${id}`, pure);
}

export async function deletePerson(id){ 
  return await firebaseDelete(`${BASE_PEOPLE}/${id}`); 
}

/* ==================================================
   TAB 2: CẬP NHẬT TRUONG HỌ - TRƯỞNG CHI
================================================== */
const BASE_TRUONG = "content/truong";

export async function addTruong(data){ 
  return await firebasePush(BASE_TRUONG, data); 
}

export async function getTruong(){ 
  const snap = await firebaseGet(BASE_TRUONG);
  if (!snap) return [];
  return Object.entries(snap).map(([id, v]) => ({ id, ...v }));
}

export async function deleteTruong(id){ 
  return await firebaseDelete(`${BASE_TRUONG}/${id}`); 
}

/* ==================================================
   TAB 3: CẬP NHẬT THÔNG TIN - THÔNG BÁO
================================================== */
const BASE_NOTICE = "content/notice";

export async function addNotice(data){
  return await firebasePush(BASE_NOTICE, data);
}

export async function getNotices(){
  const snap = await firebaseGet(BASE_NOTICE);
  if (!snap) return [];
  return Object.entries(snap).map(([id, v]) => ({
    id,
    ...v
  }));
}

export async function updateNotice(id, data){
  const { id: _remove, ...pure } = data;
  return await firebaseSet(`${BASE_NOTICE}/${id}`, pure);
}

export async function deleteNotice(id){
  return await firebaseDelete(`${BASE_NOTICE}/${id}`);
}



/* ==================================================
   TAB 4: ẢNH SỰ KIỆN (Realtime DB - base64)
================================================== */

const BASE_EVENT_IMAGE = "content/eventImage";

/* ========== ADD ========== */
export async function addEventImage({ title, link, file, date, createdAt }) {
  const base64 = await fileToBase64(file);

  return await firebasePush(BASE_EVENT_IMAGE, {
    title,
    link,
    image: base64,
    date,
    createdAt
  });
}

/* ========== GET ========== */
export async function getEventImages() {
  const snap = await firebaseGet(BASE_EVENT_IMAGE);
  if (!snap) return [];
  return Object.entries(snap).map(([id, v]) => ({ id, ...v }));
}

/* ========== DELETE ========== */
export async function deleteEventImage(id) {
  return await firebaseDelete(`${BASE_EVENT_IMAGE}/${id}`);
}

/* ========== HELPER ========== */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ==================================================
   TAB 5: CẬP NHẬT CLIP SỰ KIỆN
================================================== */
const BASE_EVENT_CLIP = "content/eventClip";

export async function addEventClip(data){ 
  return await firebasePush(BASE_EVENT_CLIP, data); 
}

export async function getEventClips(){ 
  const snap = await firebaseGet(BASE_EVENT_CLIP);
  if (!snap) return [];
  return Object.entries(snap).map(([id, v]) => ({ id, ...v }));
}

export async function deleteEventClip(id){ 
  return await firebaseDelete(`${BASE_EVENT_CLIP}/${id}`); 
}

export async function updateEventClip(id, data){ 
  const { id: _remove, ...pure } = data;
  return await firebaseSet(`${BASE_EVENT_CLIP}/${id}`, pure);
}

/* ==================================================
   TAB 6: CẬP NHẬT LINK YOUTUBE
================================================== */
/* ==================================================
   TAB 6: CẬP NHẬT LINK YOUTUBE
================================================== */
const BASE_YOUTUBE = "content/youtube";

export async function addYoutube(data){ 
  return await firebasePush(BASE_YOUTUBE, data); 
}

export async function getYoutubes(){ 
  const snap = await firebaseGet(BASE_YOUTUBE);
  if (!snap) return [];
  return Object.entries(snap).map(([id, v]) => ({ id, ...v }));
}

export async function updateYoutube(id, data){
  const { id: _remove, ...pure } = data;
  return await firebaseSet(`${BASE_YOUTUBE}/${id}`, pure);
}

export async function deleteYoutube(id){ 
  return await firebaseDelete(`${BASE_YOUTUBE}/${id}`); 
}


/* ==================================================
   TAB 7: ẢNH NỀN HEAD (Realtime DB - base64)
================================================== */
const BASE_HEAD_BG = "content/headBg";

export async function addHeadBg(data){
  return await firebasePush(BASE_HEAD_BG, data);
}

export async function getHeadBgs(){
  const snap = await firebaseGet(BASE_HEAD_BG);
  if (!snap) return [];
  return Object.entries(snap).map(([id, v]) => ({ id, ...v }));
}

export async function updateHeadBg(id, data){
  const { id: _remove, ...pure } = data;
  return await firebaseSet(`${BASE_HEAD_BG}/${id}`, pure);
}

export async function deleteHeadBg(id){
  return await firebaseDelete(`${BASE_HEAD_BG}/${id}`);
}


/* ==================================================
   TAB 8: CẬP NHẬT DANH SÁCH HỌ - CÁC CHI
================================================== */
const BASE_CHI = "meta/chi";

export async function addChi(name){
  return await firebasePush(BASE_CHI, { name });
}

export async function getChi(){
  const snap = await firebaseGet(BASE_CHI);
  if (!snap) return [];
  return Object.entries(snap).map(([id, v]) => ({ id, ...v }));
}

export async function deleteChi(id){
  return await firebaseDelete(`${BASE_CHI}/${id}`);
}
