import { DATA_MODE } from "../config.js";
import { fbGetPeople, fbAddPerson, fbUpdatePerson, fbDeletePerson } 
  from "./firebaseService.js";

/* ================= GET ================= */

export async function getPeople() {
  if (DATA_MODE === "firebase") {
    return await fbGetPeople();
  }

  // host mode (sau này)
  const res = await fetch("/data/people.json");
  return await res.json();
}

/* ================= ADD ================= */

export async function addPerson(data) {
  if (DATA_MODE === "firebase") {
    return await fbAddPerson(data);
  }

  console.warn("Host mode chưa hỗ trợ add");
}

/* ================= UPDATE ================= */

export async function updatePerson(id, data) {
  if (DATA_MODE === "firebase") {
    return await fbUpdatePerson(id, data);
  }

  console.warn("Host mode chưa hỗ trợ update");
}

/* ================= DELETE ================= */

export async function deletePerson(id) {
  if (DATA_MODE === "firebase") {
    return await fbDeletePerson(id);
  }

  console.warn("Host mode chưa hỗ trợ delete");
}
