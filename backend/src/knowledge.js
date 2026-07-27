import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ALWAYS_EXCLUDED = new Set(["persona.md", "_template.md"]);

async function walkMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (entry) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return walkMarkdown(fullPath);
        return entry.isFile() && entry.name.toLowerCase().endsWith(".md") ? [fullPath] : [];
      }),
  );
  return nested.flat();
}

export function splitFrontmatter(markdown) {
  if (!markdown.startsWith("---")) return { attributes: {}, body: markdown };
  const match = markdown.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/u);
  if (!match) return { attributes: {}, body: markdown };

  const attributes = {};
  let listKey;
  for (const rawLine of match[1].split(/\r?\n/u)) {
    const listItem = rawLine.match(/^\s+-\s+(.+?)\s*$/u);
    if (listItem && listKey) {
      attributes[listKey].push(parseScalar(listItem[1]));
      continue;
    }
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 1) {
      listKey = undefined;
      continue;
    }
    const key = line.slice(0, separator).trim().toLowerCase();
    const rawValue = line.slice(separator + 1).trim();
    if (!rawValue) {
      attributes[key] = [];
      listKey = key;
    } else {
      attributes[key] = parseScalar(rawValue);
      listKey = undefined;
    }
  }
  return { attributes, body: markdown.slice(match[0].length) };
}

function parseScalar(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  if (/^(true|false)$/iu.test(value)) return value.toLowerCase() === "true";
  if (/^(null|~)$/iu.test(value)) return null;
  // 날짜, URL, 경로는 문자열로 보존한다. 숫자 변환은 문서 계약에서 필요하지 않다.
  return value;
}

function cleanText(text) {
  return text
    .replace(/<!--[\s\S]*?-->/gu, "")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function splitFaqBlock(text) {
  const questionPattern = /^\s*\*\*Q[.:]\s*(.+?)\*\*\s*$/gimu;
  const matches = [...text.matchAll(questionPattern)];
  if (!matches.length) return null;

  const chunks = [];
  const prefix = text.slice(0, matches[0].index).trim();
  if (prefix) chunks.push({ kind: "section", text: prefix });
  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index].index;
    const end = matches[index + 1]?.index ?? text.length;
    const faqText = text.slice(start, end).trim();
    const answer = faqText.replace(questionPattern, "").replace(/^\s*A[.:]\s*/imu, "").trim();
    chunks.push({
      kind: "faq",
      question: matches[index][1].trim(),
      answer,
      text: faqText,
    });
  }
  return chunks;
}

export function chunkMarkdown(markdown, source) {
  const lines = markdown.replace(/\r\n/gu, "\n").split("\n");
  const headingPath = [];
  const sections = [];
  let buffer = [];
  let currentPath = [];

  const flush = () => {
    const text = cleanText(buffer.join("\n"));
    if (text) sections.push({ headingPath: [...currentPath], text });
    buffer = [];
  };

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/u);
    if (heading) {
      flush();
      const level = heading[1].length;
      headingPath.length = level - 1;
      headingPath[level - 1] = heading[2].trim();
      currentPath = headingPath.filter(Boolean);
    } else {
      buffer.push(line);
    }
  }
  flush();

  const chunks = [];
  let sequence = 0;
  for (const section of sections) {
    const faqParts = splitFaqBlock(section.text) ?? [{ kind: "section", text: section.text }];
    for (const part of faqParts) {
      if (!part.text) continue;
      sequence += 1;
      chunks.push({
        id: `${source}#${sequence}`,
        source,
        section: section.headingPath.join(" > ") || path.basename(source, ".md"),
        headingPath: section.headingPath,
        kind: part.kind,
        question: part.question,
        answer: part.answer,
        content: part.text,
      });
    }
  }
  return chunks;
}

function validateIndexMetadata(attributes) {
  if (attributes.index !== true) return { valid: false, reason: "index_not_true" };
  const missing = ["id", "title", "type"].filter(
    (key) => typeof attributes[key] !== "string" || !attributes[key].trim(),
  );
  if (missing.length) {
    return { valid: false, reason: "missing_metadata", missing };
  }
  return { valid: true };
}

export async function loadKnowledge(knowledgeDir) {
  const personaPath = path.join(knowledgeDir, "persona.md");
  let persona = "";
  try {
    persona = cleanText((await readFile(personaPath, "utf8")).replace(/^\uFEFF/u, ""));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const files = await walkMarkdown(knowledgeDir);
  const documents = [];
  const chunks = [];
  const diagnostics = [];
  for (const file of files) {
    const basename = path.basename(file).toLowerCase();
    if (ALWAYS_EXCLUDED.has(basename) || basename.startsWith("_")) continue;
    const raw = (await readFile(file, "utf8")).replace(/^\uFEFF/u, "");
    const { attributes, body } = splitFrontmatter(raw);
    const source = path.relative(knowledgeDir, file).split(path.sep).join("/");
    const validation = validateIndexMetadata(attributes);
    if (!validation.valid) {
      diagnostics.push({ source, ...validation });
      continue;
    }
    const url =
      (typeof attributes.url === "string" && attributes.url) ||
      (Array.isArray(attributes.sources) &&
        attributes.sources.find(
          (candidate) => typeof candidate === "string" && /^https?:\/\//iu.test(candidate),
        )) ||
      undefined;
    const metadata = {
      id: attributes.id.trim(),
      title: attributes.title.trim(),
      type: attributes.type.trim(),
      url,
    };
    const documentChunks = chunkMarkdown(body, source).map((chunk) => ({
      ...chunk,
      docId: metadata.id,
      chunkId: chunk.id,
      title: metadata.title,
      type: metadata.type,
      url: metadata.url,
    }));
    documents.push({ source, ...metadata, attributes, chunkCount: documentChunks.length });
    chunks.push(...documentChunks);
  }
  return { persona, documents, chunks, diagnostics };
}
