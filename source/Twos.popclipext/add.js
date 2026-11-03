// PopClip wraps this file in an async function.
const apiKey = String(popclip.options.apikey || "").trim();
const destination = String(popclip.options.destination ?? "today").trim();
const text = popclip.input.text;

if (!apiKey) {
  throw new Error("Settings error: enter your Twos API key.");
}
if (!destination) {
  throw new Error("Settings error: choose Today or enter an existing list name or ID.");
}
if (!text || !text.trim()) {
  throw new Error("Select some text to add to Twos.");
}

// Names and relative days are resolved by Twos. IDs avoid ambiguous names.
const target = /^[a-f0-9]{24}$/i.test(destination)
  ? { list_id: destination }
  : { list: destination };
const axios = require("axios");
let response;
try {
  response = await axios.post(
    "https://www.twosapp.com/api/v1/things",
    { ...target, text },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
      // Handle HTTP errors below without exposing request headers or text.
      validateStatus: () => true,
    },
  );
} catch (_) {
  // Do not retry a write: a lost response can still mean the item was saved.
  throw new Error("Could not confirm the save. Check Twos before trying again.");
}

if (response.status === 401) {
  throw new Error("Settings error: your Twos API key is invalid or revoked.");
}
if (response.status === 403) {
  throw new Error("Settings error: your Twos API key needs write:things permission.");
}
if (response.status === 400 || response.status === 404) {
  throw new Error("Settings error: check the destination list name or ID and your selected text.");
}
if (response.status === 429) {
  throw new Error("Twos is rate limiting requests. Wait before trying again.");
}
if (response.status !== 201 || !response.data?.thing?.id) {
  throw new Error("Could not confirm the save. Check Twos before trying again.");
}
