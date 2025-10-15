# n8n-nodes-noium

n8n community node for the Noium Operations API. It provides resources to list and retrieve Clients, Documents, and Emails from Noium, including fetching parsed document text.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

- [Installation](#installation)
- [Credentials](#credentials)
- [Operations](#operations)
- [Usage](#usage)
- [Compatibility](#compatibility)
- [Troubleshooting](#troubleshooting)
- [Version history](#version-history)

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.


## Credentials

This node uses an API key for authentication via the `Authorization` header.

The authorization key is unique to each organization; each organization requires its own "Noium account" credentials in n8n. 


## Operations

This node exposes three resources: Clients, Documents, and Emails.

### Clients

- Get (GET `/client`)
  - Returns client information for the authenticated organization.
  - Parameters: none.

### Documents

- Get Many (POST `/documents`)
  - Query:
    - `organization_id` (string, required)
  - Body options (all optional):
    - `type` (string)
    - `category` (string)
    - `created_to` (string, format `yyyy-MM-dd`)
    - `created_from` (string, format `yyyy-MM-dd`)

- Get (POST `/document`)
  - Query:
    - `organization_id` (string, required)
  - Body options (optional):
    - `type` (string)

- Get Parsed (POST `/document-parsed`)
  - Query:
    - `document_id` (string, required)
  - Body options (optional):
    - `type` (string)

### Emails

- Get Many (GET `/emails`)
  - Query options (all optional unless noted):
    - `received_from` (string)
    - `received_to` (string)
    - `has_documents` (boolean)
    - `include_parent_with_childs` (boolean)
    - `include_type` (string)

- Get (GET `/email`)
  - Query:
    - `email_id` (string, required)
  - Additional query options (optional):
    - `has_documents` (boolean)
    - `include_parent_with_childs` (boolean)
    - `include_type` (string)

## Usage

- Add the Noium node to your workflow, choose a Resource and Operation, and set the required parameters.
- Attach “Noium API” credentials to the node.
- For date filters, use `yyyy-MM-dd` to match the API expectations.
- The node sets `Accept: application/json` and `Content-Type: application/json` by default.


## Compatibility

- n8n: 1.0+ (Community Nodes)
- Node CLI: `@n8n/node-cli` used for build/dev


## Troubleshooting

- 401/403 errors: verify the `Authorization` value in credentials (include `Bearer ` if required by your key format).
- Empty or unexpected results: confirm required query parameters like `organization_id`, `email_id`, or `document_id` are set.
- Date filters: ensure `created_from`/`created_to` use `yyyy-MM-dd`.

## Version history

- 0.1.0 — Initial release with Clients (Get), Documents (Get, Get Many, Get Parsed), and Emails (Get, Get Many).

