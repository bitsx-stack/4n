export function handleApiError(error: any): string {
  const backend = error?.response?.data;

  // CASE 1: { detail: "Invalid credentials" }
  if (typeof backend?.detail === "string") return backend.detail;

  // CASE 2: { message: "Something happened" }
  if (typeof backend?.message === "string") return backend.message;

  // CASE 3: FastAPI validation errors array
  // { detail: [ { msg: "Password required", loc: [...], type: ... } ] }
  if (Array.isArray(backend?.detail) && backend.detail.length > 0) {
    return backend.detail[0].msg || "Validation failed";
  }

  // CASE 4: Axios/network fallback
  return error?.message || "Unexpected error occurred";
}
