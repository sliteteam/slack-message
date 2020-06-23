const { WebClient } = require("@slack/web-api");
const core = require("@actions/core");

// Replace this tag in raw JSONs with current time value (ready for slack `ts` values)
const NOW_TS_TAG = "%NOW_TS%";

async function run() {
  try {
    const token = core.getInput("token", { required: true });
    const channel = core.getInput("channel", { required: true });
    const ts = core.getInput("ts", { required: false });

    const text = core.getInput("text", { required: false }) || undefined;
    const blocksRaw = core.getInput("blocks", { required: false }) || undefined;
    const attachmentsRaw =
      core.getInput("attachments", { required: false }) || undefined;
    const appendText =
      core.getInput("appendText", { required: false }) || undefined;
    const appendBlocksRaw =
      core.getInput("appendBlocks", {
        required: false,
      }) || undefined;
    const appendAttachmentsRaw =
      core.getInput("appendAttachments", {
        required: false,
      }) || undefined;

    if (!token) {
      throw new Error("Missing input `token`");
    }

    const client = new WebClient(token);
    const blocks = blocksRaw
      ? JSON.parse(blocksRaw.replace(NOW_TS_TAG, toSlackTS()))
      : undefined;
    const attachments = attachmentsRaw
      ? JSON.parse(attachmentsRaw.replace(NOW_TS_TAG, toSlackTS()))
      : undefined;
    const appendAttachments = appendAttachmentsRaw
      ? JSON.parse(appendAttachmentsRaw.replace(NOW_TS_TAG, toSlackTS()))
      : undefined;
    const appendBlocks = appendBlocksRaw
      ? JSON.parse(appendBlocksRaw.replace(NOW_TS_TAG, toSlackTS()))
      : undefined;

    if (!ts) {
      // just post a new message
      const message = {
        channel,
        text,
        blocks,
        attachments,
      };
      const result = await client.chat.postMessage(message);
      if (result.error) {
        throw new Error(`Error while posting slack message: ${result.error}`);
      }
      const { ts } = result;
      core.setOutput("ts", ts);
      return;
    }

    // retrive the original message
    const response = await client.conversations.history({
      token,
      channel,
      latest: ts,
      inclusive: true,
      limit: 1,
    });

    const [message] = response.messages;

    const payload = {
      // required refs
      channel,
      ts,
      // new attributes
      text: appendText
        ? [message.text, appendText].filter(Boolean).join("")
        : text || message.text,
      blocks: mergeItems(message.blocks, blocks, appendBlocks),
      attachments: mergeItems(
        message.attachments,
        attachments,
        appendAttachments
      ),
    };

    core.debug(JSON.stringify(payload, null, 2));

    const result = await client.chat.update(payload);

    if (result.error) {
      throw new Error(
        `Error happend while updating slack message: ${result.error}`
      );
    }
    core.setOutput("ts", ts);
  } catch (error) {
    core.debug(error.message);
    core.setFailed(
      `Something went wrong while sending a message to slack: ${error.message}`
    );
  }
}

run();

function toSlackTS(timestamp = Date.now()) {
  return `${Math.floor(timestamp / 1000)}`;
}

function mergeItems(originalItems, newItems, appenedItems) {
  if (!originalItems) {
    return newItems || appenedItems;
  }

  if (!appenedItems) {
    return newItems;
  }

  const items = [...originalItems, ...appenedItems];
  if (!items.length) {
    return undefined;
  }
  return items;
}
