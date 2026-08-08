export function isImage(type: string) {
  return type.startsWith("image/");
}

export function isPdf(type: string) {
  return type === "application/pdf";
}