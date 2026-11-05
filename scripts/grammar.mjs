// Node versiyasini tekshiradi va TypeScript skriptini ishga tushiradi (Node'ning o'rnatilgan type-stripping'i).
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 18)) {
  console.error(
    `Grammatika skriptlari Node >= 22.18 talab qiladi (hozir ${process.versions.node}). ` +
      "Build muhitida Node versiyasini yangilang.",
  );
  process.exit(1);
}
await import("./grammar.ts");
