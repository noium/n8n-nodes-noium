# n8n-nodes-noium

This is an n8n community node for [Noium](https://noium.com). It uploads documents to your Noium organization and gets them back, with their files, in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

- [Installation](#installation)
- [Operations](#operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Resources](#resources)
- [Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. The package name is `n8n-nodes-noium`.

## Operations

The node works with the [Noium API](https://api.noium.com/docs).

### Document

| Operation  | What it does                                                                                                                                                     | API endpoint                     | API key scope      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------ |
| **Upload** | Creates a document in your organization from a file in the input item's binary data. You can set the document's type and category, and override its file name.   | `POST /v1/documents`             | `documents:upload` |
| **Get**    | Returns a document by ID, including a download link that expires after 5 minutes. Turn on **Download File** to add the file itself to the output as binary data. | `GET /v1/documents/{documentId}` | `documents:get`    |

Uploaded files can be up to 40 MB.

## Credentials

The node authenticates with a Noium API key, sent as `Authorization: Bearer <key>`.

1. In Noium, open **Organization settings → API keys** (organization owners and admins only) and create a key.
2. Give it the scopes for the operations you will use: `documents:upload` and `documents:get`. Add `organization:get` too if you want n8n's **Test** button to confirm the key works.
3. In n8n, create a **Noium API** credential and paste the key. The key is shown only once; if you lose it, revoke it and create a new one.

Each key belongs to one organization, so create one credential per Noium organization.

Leave **Base URL** as `https://api.noium.com` unless Noium has given you another environment to use.

## Compatibility

Tested with n8n 2.45. Requires n8n 1.0 or later.

## Usage

**Upload files from another app.** Add a node that outputs a file as binary data (for example Gmail, Google Drive, or **Read/Write Files from Disk**), then a Noium node with **Upload**. Set **Input Binary Field** to the field holding the file (usually `data`). The output is the new document, including its `id`. If an input item has no file in that field, or the file is empty, the node stops before calling Noium and its error lists the binary fields the item does have (an email trigger names them `attachment_0`, `attachment_1`, …).

**Get a document and its file.** Use **Get** with the document's ID, for example `{{ $json.id }}` after an upload. Turn on **Download File** to pass the file on to the next node.

Errors come from the Noium API with a stable code and message, for example `INSUFFICIENT_SCOPE` when the API key lacks a scope or `NOT_FOUND` for an unknown document ID. The API allows 600 requests per minute per key.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Noium API reference](https://api.noium.com/docs)

## Version history

- **2.0.0**: Rebuilt on the Noium public API (`https://api.noium.com/v1`) with Bearer API keys. Operations: Document → Upload and Get, with optional file download. Removed the earlier Client, Document and Email operations, which used the old operations API. Existing **Noium API** credentials need a new API key.
- **1.0.1**: Description change.
- **1.0.0**: Initial release with Clients (Get), Documents (Get, Get Many, Get Parsed) and Emails (Get, Get Many).
