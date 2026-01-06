import { firebaseUpload } from "./firebaseService.js";

export async function uploadToFirebase(path, file) {
  return await firebaseUpload(path, file);
}
