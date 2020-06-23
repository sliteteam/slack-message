# Slack message

Simply send a message to Slack from a Slack bot

## Usage

```yaml
inputs:
  token:
    description: 'The slack bot token'
    required: true
  channel:
    description: 'Send the message to this channel'
    required: true
  text:
    description: "The message's base text"
    required: false
  blocks:
    description: "Optional array of blocks (JSON.stringify'ed)"
    required: false
  attachments:
    description: "Optional array of attachements (JSON.stringify'ed)"
    required: false
  appendText:
    description: 'Append given text to original message'
    required: false
  appendBlocks:
    description: 'Append given blocks to original message'
    required: false
  appendAttachments:
    description: 'Append given attachments to original message'
    required: false
  ts:
    description: 'If passed, update matching message instead of posting a new one'
    required: false
outputs:
  ts:
    description: 'Updated or created message for later reference'
```
