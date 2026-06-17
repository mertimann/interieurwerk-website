// ============================================================
//  InterieurWERK – Veröffentlichungs-Server (Netlify Function)
//  Nimmt Passwort + content.json + neue Bilder entgegen und
//  committet sie sicher zu GitHub. Der GitHub-Token liegt NUR
//  als Netlify-Umgebungsvariable auf dem Server, NIE im Browser.
//
//  Benötigte Umgebungsvariablen (in Netlify -> Site settings -> Environment):
//    GITHUB_TOKEN   = Fine-grained Token mit "Contents: Read and write"
//    EDIT_PASSWORD  = Passwort, das im Editor abgefragt wird
//    GITHUB_REPO    = (optional) "owner/repo", Standard unten
//    GITHUB_BRANCH  = (optional) Branch, Standard "main"
// ============================================================

const DEFAULT_REPO = "mertimann/interieurwerk-website";
const DEFAULT_BRANCH = "main";

function gh(repo, path, token, method, body) {
  return fetch("https://api.github.com/repos/" + repo + path, {
    method: method || "GET",
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "interieurwerk-editor",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function getSha(repo, path, token, branch) {
  const r = await gh(repo, path + "?ref=" + branch, token, "GET");
  if (r.status === 200) {
    const j = await r.json();
    return j.sha;
  }
  return undefined; // existiert noch nicht
}

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Nur POST erlaubt." };

  const token = process.env.GITHUB_TOKEN;
  const pass = process.env.EDIT_PASSWORD;
  const repo = process.env.GITHUB_REPO || DEFAULT_REPO;
  const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;

  if (!token || !pass) {
    return { statusCode: 500, headers: cors, body: "Server ist noch nicht eingerichtet (GITHUB_TOKEN / EDIT_PASSWORD fehlen)." };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: cors, body: "Ungültige Daten." };
  }

  if (!data.password || data.password !== pass) {
    return { statusCode: 401, headers: cors, body: "Falsches Passwort." };
  }
  if (!data.content || typeof data.content !== "object") {
    return { statusCode: 400, headers: cors, body: "Keine Inhalte übermittelt." };
  }

  const msg = data.message || "Inhalte über den Editor aktualisiert";

  try {
    // 1) Neue Bilder zuerst hochladen (als echte Dateien in /uploads)
    const images = Array.isArray(data.images) ? data.images : [];
    for (const img of images) {
      if (!img || !img.name || !img.base64) continue;
      const safe = String(img.name).replace(/[^a-zA-Z0-9._-]/g, "_");
      const p = "/contents/uploads/" + safe;
      const sha = await getSha(repo, p, token, branch);
      const put = await gh(repo, p, token, "PUT", {
        message: "Bild hochgeladen: " + safe,
        content: img.base64,
        branch: branch,
        sha: sha,
      });
      if (!put.ok) {
        const t = await put.text();
        return { statusCode: 502, headers: cors, body: "Bild-Upload fehlgeschlagen (" + safe + "): " + t.slice(0, 300) };
      }
    }

    // 2) content.json aktualisieren
    const cPath = "/contents/content.json";
    const cSha = await getSha(repo, cPath, token, branch);
    const contentStr = JSON.stringify(data.content, null, 2);
    const contentB64 = Buffer.from(contentStr, "utf8").toString("base64");
    const cput = await gh(repo, cPath, token, "PUT", {
      message: msg,
      content: contentB64,
      branch: branch,
      sha: cSha,
    });
    if (!cput.ok) {
      const t = await cput.text();
      return { statusCode: 502, headers: cors, body: "Speichern fehlgeschlagen: " + t.slice(0, 300) };
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: "Fehler: " + String(e && e.message ? e.message : e) };
  }
};
