// ĐIỂM DUY NHẤT UI GỌI UPLOAD
import { uploadToFirebase } from "./upload.firebase.js";

export async function uploadFile(path, file) {
  return await uploadToFirebase(path, file);
}
