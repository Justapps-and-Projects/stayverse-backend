/**
 * Generates Stayverse app icons (gold S for user, black S for agent).
 * Usage: node scripts/generate-app-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const MARK_PATHS = `
  <path d="M0.953125 15.5624L8.29548 19.8364L8.27819 11.3175L12.5467 8.82422L19.8618 13.07L19.8663 4.56203L12.5422 0.307129L0.954944 7.02343L0.953125 15.5624Z" fill="{{COLOR}}"/>
  <path d="M19.8663 18.1485L12.524 13.8735L12.5413 22.3924L8.27273 24.8857L0.958584 20.6399L0.953125 29.1479L8.27819 33.4028L19.8645 26.6865L19.8663 18.1485Z" fill="{{COLOR}}"/>
`;

function markSvg(color, size, withBackground = true) {
  const pad = size * 0.26;
  const markW = size - pad * 2;
  const markH = (markW * 34) / 20;
  const x = (size - markW) / 2;
  const y = (size - markH) / 2;
  const bg = withBackground
    ? `<rect width="${size}" height="${size}" fill="#FFFFFF"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  <svg x="${x}" y="${y}" width="${markW}" height="${markH}" viewBox="0 0 20 34">
    ${MARK_PATHS.replace(/\{\{COLOR\}\}/g, color)}
  </svg>
</svg>`;
}

function renderPng(svg, width) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
  });
  return resvg.render().asPng();
}

function writeIcons(appDir, markColor) {
  const assets = path.join(appDir, "assets");
  fs.mkdirSync(assets, { recursive: true });

  const files = {
    "icon.png": markSvg(markColor, 1024, true),
    "splash-icon.png": markSvg(markColor, 512, true),
    "favicon.png": markSvg(markColor, 48, true),
    "android-icon-foreground.png": markSvg(markColor, 1024, false),
    "android-icon-monochrome.png": markSvg(markColor, 1024, false),
  };

  for (const [name, svg] of Object.entries(files)) {
    const size = name === "favicon.png" ? 48 : name === "splash-icon.png" ? 512 : 1024;
    fs.writeFileSync(path.join(assets, name), renderPng(svg, size));
    console.log(`  wrote ${name}`);
  }

  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="#FFFFFF"/>
  </svg>`;
  fs.writeFileSync(
    path.join(assets, "android-icon-background.png"),
    renderPng(bgSvg, 1024),
  );
  console.log("  wrote android-icon-background.png");
}

const apps = [
  { dir: path.join(root, "apps/user-app"), color: "#FBC036" },
  { dir: path.join(root, "apps/agent-app"), color: "#2C2C2C" },
];

for (const app of apps) {
  console.log(`Generating icons for ${path.basename(app.dir)} (${app.color})`);
  writeIcons(app.dir, app.color);
}

console.log("Done.");
