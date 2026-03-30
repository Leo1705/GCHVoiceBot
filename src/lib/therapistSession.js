/**
 * Client-side: store/read therapist (name, email) for the current session.
 * Used by the session page (onboarding + end) and optional pre-fill from bookmarks.
 */

const STORAGE_KEY = "gch_therapist";

export function setTherapistForSession(therapistName, therapistEmail) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        therapistName: String(therapistName || "").trim(),
        therapistEmail: String(therapistEmail || "").trim(),
      })
    );
  } catch (e) {
    console.warn("Could not store therapist", e);
  }
}

export function getTherapistFromSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearTherapistFromSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

const PATIENT_KEY = "gch_patient";

export function setPatientName(name) {
  const info = getPatientInfo();
  setPatientInfo(name || info.patientName, info.patientEmail);
}

export function getPatientName() {
  return getPatientInfo().patientName || "";
}

export function setPatientInfo(patientName, patientEmail) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      PATIENT_KEY,
      JSON.stringify({
        patientName: String(patientName || "").trim(),
        patientEmail: String(patientEmail || "").trim(),
      })
    );
  } catch (e) {
    console.warn("Could not store patient info", e);
  }
}

export function getPatientInfo() {
  if (typeof window === "undefined") return { patientName: "", patientEmail: "" };
  try {
    const raw = localStorage.getItem(PATIENT_KEY);
    if (!raw) return { patientName: "", patientEmail: "" };
    const data = JSON.parse(raw);
    return {
      patientName: String(data.patientName || "").trim(),
      patientEmail: String(data.patientEmail || "").trim(),
    };
  } catch {
    return { patientName: "", patientEmail: "" };
  }
}

export function clearPatientInfo() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PATIENT_KEY);
  } catch {}
}

export function clearPatientName() {
  clearPatientInfo();
}
