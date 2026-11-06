import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';

import {
	isNotFoundError,
	isValidWebhookSignature,
	noiumApiRequest,
} from '../Noium/GenericFunctions';

// Noium's webhook events (GET https://api.noium.com/docs → Webhooks), labelled as in the Noium app.
const EVENT_OPTIONS = [
	{
		name: 'Conversation Assigned',
		value: 'conversation.assigned',
		description: 'A member is assigned to a conversation',
	},
	{
		name: 'Conversation Closed',
		value: 'conversation.closed',
		description: 'A conversation is closed',
	},
	{
		name: 'Conversation Reopened',
		value: 'conversation.reopened',
		description: 'A conversation is reopened',
	},
	{
		name: 'Conversation Started',
		value: 'conversation.created',
		description: 'A conversation starts (without its messages)',
	},
	{
		name: 'Document Approved',
		value: 'document.approved',
		description: 'A document is approved',
	},
	{
		name: 'Document Deleted',
		value: 'document.deleted',
		description: 'A document is deleted (only its ID is sent)',
	},
	{
		name: 'Document Processed',
		value: 'document.completed',
		description: 'A document finished processing and its data is extracted',
	},
	{
		name: 'Document Updated',
		value: 'document.updated',
		description:
			'A document’s type, category, date, metadata, booking-skip mark, or counterparty or invoice link changes',
	},
	{
		name: 'Document Uploaded',
		value: 'document.created',
		description: 'A document is added (upload, email, API), before its data is extracted',
	},
	{
		name: 'Invoice Cancelled',
		value: 'invoice.cancelled',
		description: 'A sales invoice is cancelled',
	},
	{
		name: 'Invoice Issued',
		value: 'invoice.issued',
		description: 'A sales invoice is issued (approved)',
	},
	{
		name: 'Invoice Paid',
		value: 'invoice.paid',
		description: 'A sales invoice is marked paid',
	},
	{
		name: 'Invoice Sent',
		value: 'invoice.sent',
		description: 'A sales invoice is emailed to the buyer (every time it is sent)',
	},
	{
		name: 'Message Received',
		value: 'conversation.message.received',
		description:
			'A message arrives from outside your organization (without its body; get it with Conversation → Get Message)',
	},
];

// Noium limits a webhook's description to 255 characters.
const WEBHOOK_DESCRIPTION_MAX_LENGTH = 255;

type NoiumWebhook = {
	id?: string;
	url?: string;
	events?: string[];
	enabled?: boolean;
	pausedAt?: string | null;
};
type WebhookStaticData = { webhookId?: string; secret?: string };

const sameEvents = (a: string[] = [], b: string[] = []) =>
	a.length === b.length && a.every((event) => b.includes(event));

export class NoiumTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Noium Trigger',
		name: 'noiumTrigger',
		icon: { light: 'file:../Noium/noium.svg', dark: 'file:../Noium/noium.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when documents, invoices or conversations change in Noium',
		defaults: {
			name: 'Noium Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'noiumApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: EVENT_OPTIONS,
				default: [],
				description: 'The Noium events that start the workflow',
			},
		],
	};

	webhookMethods = {
		default: {
			// The webhook this node registered is reused only while it still matches the node: same URL
			// and events, and neither turned off nor paused by Noium after failed deliveries.
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as WebhookStaticData;
				if (!staticData.webhookId) return false;

				const path = `/v1/webhooks/${encodeURIComponent(staticData.webhookId)}`;
				try {
					const webhook = (await noiumApiRequest.call(this, {
						method: 'GET',
						path,
					})) as NoiumWebhook;
					const isCurrent =
						webhook.url === this.getNodeWebhookUrl('default') &&
						sameEvents(webhook.events, this.getNodeParameter('events') as string[]) &&
						webhook.enabled !== false &&
						!webhook.pausedAt &&
						!!staticData.secret;
					if (isCurrent) return true;

					await noiumApiRequest.call(this, { method: 'DELETE', path });
				} catch (error) {
					// Requests fail with a NodeApiError, which its constructor returns unchanged.
					if (!isNotFoundError(error)) throw new NodeApiError(this.getNode(), error as JsonObject);
				}

				delete staticData.webhookId;
				delete staticData.secret;
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const workflow = this.getWorkflow();
				const webhook = await noiumApiRequest.call(this, {
					method: 'POST',
					path: '/v1/webhooks',
					body: {
						url: this.getNodeWebhookUrl('default'),
						events: this.getNodeParameter('events') as string[],
						description: `n8n: ${workflow.name ?? workflow.id ?? 'workflow'}`.slice(
							0,
							WEBHOOK_DESCRIPTION_MAX_LENGTH,
						),
					},
				});

				const staticData = this.getWorkflowStaticData('node') as WebhookStaticData;
				staticData.webhookId = webhook.id as string;
				staticData.secret = webhook.secret as string;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as WebhookStaticData;
				if (staticData.webhookId) {
					try {
						await noiumApiRequest.call(this, {
							method: 'DELETE',
							path: `/v1/webhooks/${encodeURIComponent(staticData.webhookId)}`,
						});
					} catch (error) {
						if (!isNotFoundError(error)) return false;
					}
				}

				delete staticData.webhookId;
				delete staticData.secret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const request = this.getRequestObject();
		const { secret } = this.getWorkflowStaticData('node') as WebhookStaticData;
		const headers = this.getHeaderData() as IDataObject;
		// A repeated header arrives as a list; only a single value can be a valid signature header.
		const header = (name: string) =>
			typeof headers[name] === 'string' ? (headers[name] as string) : undefined;
		// The signature covers the exact bytes Noium sent; n8n keeps them as `rawBody`.
		const rawBody =
			(request as unknown as { rawBody?: Buffer }).rawBody ?? JSON.stringify(request.body);

		const isSigned =
			!!secret &&
			isValidWebhookSignature(
				secret,
				{
					id: header('webhook-id'),
					timestamp: header('webhook-timestamp'),
					signature: header('webhook-signature'),
				},
				rawBody,
			);
		if (!isSigned) {
			this.getResponseObject().status(401).send('Invalid webhook signature').end();
			return { noWebhookResponse: true };
		}

		return { workflowData: [this.helpers.returnJsonArray(request.body as IDataObject)] };
	}
}
