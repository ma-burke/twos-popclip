// PopClip wraps this file in an async function.
const apiKey = String(popclip.options.apikey || "").trim();
const destination = String(popclip.options.destination ?? "today").trim();
const thingType = String(popclip.options.thingtype ?? "dash");
const rawTag = String(popclip.options.defaulttag ?? "").trim();
const tagName = rawTag.replace(/^#+/u, "").trim().normalize("NFC");
const text = popclip.input.text;

if (!apiKey) {
  throw new Error("Settings error: enter your Twos API key.");
}
if (!destination) {
  throw new Error("Settings error: choose Today or enter an existing list name or ID.");
}
if (!["dash", "todo", "bullet", "number", "none", "sublist"].includes(thingType)) {
  throw new Error("Settings error: choose a default thing type.");
}
if (rawTag && !/^[\p{L}\p{M}\p{N}_-]+$/u.test(tagName)) {
  throw new Error("Settings error: enter one tag using letters, numbers, underscores or hyphens, with or without #.");
}
if (!text || !text.trim()) {
  throw new Error("Select some text to add to Twos.");
}

const tag = tagName ? `#${tagName}` : "";
const existingTags = [...text.matchAll(/(?:^|[\s([{])(#[\p{L}\p{M}\p{N}_-]+)/gu)]
  .map(match => match[1].normalize("NFC"));
const alreadyTagged = tag && existingTags.some(existing => existing.toLowerCase() === tag.toLowerCase());
const taggedText = tag && !alreadyTagged
  ? text + (/\s$/u.test(text) ? "" : " ") + tag
  : text;
// Preserve existing visible hashtags when explicitly sending the default tag.
const tags = [...new Map([...existingTags, tag].filter(Boolean).map(value => [value.toLowerCase(), value])).values()];
const tagFields = tag ? { tags } : {};

// Names and relative days are resolved by Twos. IDs avoid ambiguous names.
const target = /^[a-f0-9]{24}$/i.test(destination)
  ? { list_id: destination }
  : { list: destination };
const axios = require("axios");
const requestOptions = {
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  timeout: 20000,
  // Handle errors without exposing the request headers, key, or selected text.
  validateStatus: () => true,
};
let createdSublist = false;

function saveError(message) {
  // Creating a sublist and linking it are two separate API writes.
  if (createdSublist) {
    return new Error("A new sublist was created, but its placement could not be confirmed. Check Twos Lists and the destination before retrying. " + message);
  }
  return new Error(message);
}

async function create(path, body, objectKey) {
  let response;
  try {
    response = await axios.post(`https://www.twosapp.com/api/v1/${path}`, body, requestOptions);
  } catch (_) {
    // Never automatically retry a write: a lost response may still mean success.
    throw saveError("Could not confirm the save. Check Twos before trying again.");
  }
  if (response.status === 401) {
    throw saveError("Settings error: your Twos API key is invalid or revoked.");
  }
  if (response.status === 403) {
    const permission = path === "lists" ? "write:lists" : "write:things";
    throw saveError(`Settings error: your Twos API key needs ${permission} permission.`);
  }
  if (response.status === 400 || response.status === 404) {
    throw saveError("Settings error: check the destination list name or ID and your selected text.");
  }
  if (response.status === 429) {
    throw saveError("Twos is rate limiting requests. Wait before trying again.");
  }
  const id = response.data?.[objectKey]?.id;
  if (response.status !== 201 || typeof id !== "string" || !id.trim()) {
    throw saveError("Could not confirm the save. Check Twos before trying again.");
  }
  return response.data[objectKey];
}

if (thingType === "sublist") {
  // A native sublist is a real list plus a list_ref row in its parent.
  // Flatten selection line breaks into a readable list title.
  const title = taggedText.replace(/\s+/gu, " ").trim();
  const list = await create("lists", { title }, "list");
  createdSublist = true;
  await create("things", { ...target, text: title, list_ref: list.id, ...tagFields }, "thing");
} else {
  await create("things", { ...target, text: taggedText, type: thingType, ...tagFields }, "thing");
}
