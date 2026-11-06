# n8n-nodes-noium

This is an n8n community node package for [Noium](https://noium.com). It lets your n8n workflows upload and fetch documents, read invoices, conversations, clients, counterparties and goods and services, and start when something happens in Noium.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

- [Installation](#installation)
- [Operations](#operations)
- [Noium Trigger](#noium-trigger)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Resources](#resources)
- [Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. The package name is `n8n-nodes-noium`. It adds two nodes: **Noium** and **Noium Trigger**.

## Operations

The **Noium** node works with the [Noium API](https://api.noium.com/docs). Each operation needs its scope on the API key.

| Resource            | Operation       | What it does                                                                                                                                                                        | API key scope                |
| ------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **Client**          | **Get**         | Returns a client of your organization by ID.                                                                                                                                        | `clients:get`                |
|                     | **Get Many**    | Returns your organization's clients, newest first. Filter by status or search by company name or registration number.                                                               | `clients:list`               |
| **Conversation**    | **Get Many**    | Returns your organization's conversations with their messages, most recently updated first. Filter by open or closed.                                                               | `conversations:list`         |
|                     | **Get Message** | Returns one message of a conversation, including its body and attachments.                                                                                                          | `conversations:messages:get` |
| **Counterparty**    | **Get Many**    | Returns your counterparties (the suppliers and customers on your invoices) with their bank accounts. Search by name, registration number or VAT ID.                                 | `counterparties:list`        |
| **Document**        | **Upload**      | Creates a document from a file in the input item's binary data. You can set the document's type and category, and override its file name. Files can be up to 40 MB.                 | `documents:upload`           |
|                     | **Get**         | Returns a document by ID, including a download link that expires after 5 minutes. Turn on **Download File** to add the file itself to the output as binary data.                    | `documents:get`              |
| **Good or Service** | **Get Many**    | Returns your goods and services catalog with VAT codes and sale and purchase accounts. Filter by type, search by name, external ID, product code or barcode, include inactive ones. | `goods-services:list`        |
| **Invoice**         | **Get**         | Returns an invoice by ID with its lines and their dimension values.                                                                                                                 | `invoices:get`               |
| **Webhook**         | **Get**         | Returns a webhook by ID with its last delivery result.                                                                                                                              | `webhooks:list`              |
|                     | **Get Many**    | Returns your organization's webhooks, including the ones Noium Trigger nodes registered.                                                                                            | `webhooks:list`              |

**Get Many** returns one n8n item per result. Turn on **Return All** to read everything, or set **Limit** (50 by default); the node reads the pages it needs.

## Noium Trigger

The **Noium Trigger** node starts a workflow when one of the events you pick happens in your organization:

- **Documents**: uploaded, processed (data extracted), approved, updated, deleted
- **Invoices**: issued, sent, paid, cancelled (sales invoices)
- **Conversations**: started, closed, reopened, assigned, message received

When you activate the workflow, the node registers a webhook in Noium for exactly those events, and removes it when you deactivate the workflow. It appears in Noium under **Settings → Integrations → Webhooks** with the description `n8n: <workflow name>`. Every request is checked against the webhook's signing secret ([Standard Webhooks](https://www.standardwebhooks.com)); unsigned, wrongly signed or stale requests are rejected with `401` and don't start the workflow.

The output item is the event as Noium sends it:

```json
{ "id": "…", "type": "invoice.paid", "createdAt": "2026-12-10T10:00:00.000Z", "organizationId": "…", "data": { "object": { … } } }
```

`data.object` is the document, invoice or conversation, in the same shape the **Noium** node's **Get** returns it. **Document Deleted** sends only `{ "id" }`, and **Message Received** sends the message without its body; use **Conversation → Get Message** to read it.

The trigger needs the scopes `webhooks:create`, `webhooks:list` and `webhooks:delete`. An organization can have up to 10 webhooks, and each active workflow with a Noium Trigger uses one. If Noium pauses the webhook after failed deliveries (for example while n8n was down), deactivate and activate the workflow to register a fresh one. Events can arrive out of order and, rarely, twice: use the event `id` to skip one you already handled.

## Credentials

Both nodes authenticate with a Noium API key, sent as `Authorization: Bearer <key>`.

1. In Noium, open **Organization settings → API keys** (organization owners and admins only) and create a key.
2. Give it the scopes of the operations you will use (see [Operations](#operations) and [Noium Trigger](#noium-trigger)). Add `organization:get` too if you want n8n's **Test** button to confirm the key works.
3. In n8n, create a **Noium API** credential and paste the key. The key is shown only once; if you lose it, revoke it and create a new one.

Each key belongs to one organization, so create one credential per Noium organization.

Leave **Base URL** as `https://api.noium.com` unless Noium has given you another environment to use.

## Compatibility

Tested with n8n 2.45. Requires n8n 1.0 or later.

## Usage

**Upload files from another app.** Add a node that outputs a file as binary data (for example Gmail, Google Drive, or **Read/Write Files from Disk**), then a Noium node with **Document → Upload**. Set **Input Binary Field** to the field holding the file (usually `data`). The output is the new document, including its `id`. If an input item has no file in that field, or the file is empty, the node stops before calling Noium and its error lists the binary fields the item does have (an email trigger names them `attachment_0`, `attachment_1`, …).

**Get a document and its file.** Use **Document → Get** with the document's ID, for example `{{ $json.id }}` after an upload. Turn on **Download File** to pass the file on to the next node.

**React to paid invoices.** Add a **Noium Trigger** with the **Invoice Paid** event. Each paid sales invoice starts the workflow, with the invoice in `{{ $json.data.object }}`.

**Read new messages.** Add a **Noium Trigger** with **Message Received**, then a Noium node with **Conversation → Get Message**, setting **Conversation ID** to `{{ $json.data.object.conversationId }}` and **Message ID** to `{{ $json.data.object.id }}`.

Errors come from the Noium API with a stable code and message, for example `INSUFFICIENT_SCOPE` when the API key lacks a scope or `NOT_FOUND` for an unknown ID. The API allows 600 requests per minute per key.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Noium API reference](https://api.noium.com/docs)

## Version history

- **Unreleased**: New **Noium Trigger** node for document, invoice and conversation events. New read operations in the **Noium** node: Client (Get, Get Many), Conversation (Get Many, Get Message), Counterparty (Get Many), Good or Service (Get Many), Invoice (Get), Webhook (Get, Get Many). A document ID or input binary field that resolves to nothing now gives a clear error.
- **2.1.0**: Fully qualified node identifier in the codex file, for n8n verification. A missing or empty upload file is explained instead of n8n's generic binary error.
- **2.0.0**: Rebuilt on the Noium public API (`https://api.noium.com/v1`) with Bearer API keys. Operations: Document → Upload and Get, with optional file download. Removed the earlier Client, Document and Email operations, which used the old operations API. Existing **Noium API** credentials need a new API key.
- **1.0.1**: Description change.
- **1.0.0**: Initial release with Clients (Get), Documents (Get, Get Many, Get Parsed) and Emails (Get, Get Many).
