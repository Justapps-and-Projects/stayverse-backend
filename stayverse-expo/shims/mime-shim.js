// RN-safe replacement for the `mime` package.
// The upstream `mime@1.x` uses Node's `fs`, which is unavailable in React
// Native and breaks Metro bundling (pulled in transitively by stream-chat-expo).
// We only need getType/getExtension for a small set of media types, so this
// implements just that surface without any Node built-ins.

const typeToExt = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/3gpp": "3gp",
  "video/x-msvideo": "avi",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "text/plain": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

const extToType = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  mov: "video/quicktime",
  "3gp": "video/3gpp",
  avi: "video/x-msvideo",
  webm: "video/webm",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  pdf: "application/pdf",
  zip: "application/zip",
  txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function getExtensionFromPath(pathOrName) {
  if (!pathOrName || typeof pathOrName !== "string") return null;
  const clean = pathOrName.split(/[?#]/)[0];
  const lastDot = clean.lastIndexOf(".");
  if (lastDot === -1) return null;
  return clean.slice(lastDot + 1).toLowerCase();
}

const mime = {
  getType(pathOrName) {
    const ext = getExtensionFromPath(pathOrName);
    if (!ext) return null;
    return extToType[ext] || null;
  },
  getExtension(type) {
    if (!type || typeof type !== "string") return null;
    return typeToExt[type.toLowerCase()] || null;
  },
};

module.exports = mime;
module.exports.default = mime;
