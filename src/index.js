const { WebClient } = require('@slack/web-api')
const core = require('@actions/core')

// Replace this tag in raw JSONs with current time value (ready for slack `ts` values)
const NOW_TS_TAG = '%NOW-TS%'

async function run() {
  try {
    const token = core.getInput('token', { required: true })
    const channel = core.getInput('channel', { required: true })
    const text = core.getInput('text', { required: false })
    const blocksRaw = core.getInput('blocks', { required: false })
    const attachmentsRaw = core.getInput('attachments', { required: false })
    const ts = core.getInput('ts', { required: false })
    const appendText = core.getInput('appendAttachments', { required: false })
    const appendBlocksRaw = core.getInput('appendAttachments', {
      required: false,
    })
    const appendAttachmentsRaw = core.getInput('appendAttachments', {
      required: false,
    })

    if (!token) {
      throw new Error('Missing input `token`')
    }

    const client = new WebClient(token)
    const blocks = blocksRaw
      ? JSON.parse(blocksRaw.replace(NOW_TS_TAG, toSlackTS()))
      : undefined
    const attachments = attachmentsRaw
      ? JSON.parse(attachmentsRaw.replace(NOW_TS_TAG, toSlackTS()))
      : undefined
    const appendAttachments = appendAttachmentsRaw
      ? JSON.parse(appendAttachmentsRaw.replace(NOW_TS_TAG, toSlackTS()))
      : undefined
    const appendBlocks = appendBlocksRaw
      ? JSON.parse(appendBlocksRaw.replace(NOW_TS_TAG, toSlackTS()))
      : undefined

    if (!ts) {
      // just post a new message
      const message = {
        channel,
        text,
        blocks,
        attachments,
      }
      const result = await client.chat.postMessage(message)
      if (result.error) {
        throw new Error(
          `Error happendAttachments while posting slack message: ${result.error}`
        )
      }
      const { ts } = result
      core.setOutput('ts', ts)
      return
    }

    // retrive the original message
    const response = await client.conversations.history({
      token,
      channel,
      latest: ts,
      inclusive: true,
      limit: 1,
    })

    const [message] = response.messages

    const result = await client.chat.update({
      // required refs
      channel,
      ts,
      // new attributes
      text: appendText
        ? [message.text, appendText].filter(Boolean).join('')
        : text || message.text,
      blocks: appendBlocks
        ? [...(message.blocks || []), ...appendBlocks].filter(Boolean)
        : blocks || message.blocks,
      attachments: appendAttachments
        ? [...(message.attachments || []), ...appendAttachments].filter(Boolean)
        : attachments || message.attachments,
    })

    if (result.error) {
      throw new Error(
        `Error happend while updating slack message: ${result.error}`
      )
    }
    core.setOutput('ts', ts)
  } catch (error) {
    core.debug(error.message)
    core.setFailed(
      `Something went wrong while sending a message to slack: ${error.message}`
    )
  }
}

run()

function toSlackTS(timestamp = Date.now()) {
  return `${Math.floor(timestamp / 1000)}`
}
