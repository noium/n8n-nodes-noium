import type { IDataObject, INodeProperties } from 'n8n-workflow';

import { noiumApiRequest } from '../GenericFunctions';
import type { NoiumOperation } from './common';
import { getManyFields, getPaging, getPathId, toOutputItems } from './common';

export const webhookOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['webhook'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get a webhook with its last delivery result',
				action: 'Get a webhook',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description:
					"Get your organization's webhooks, including the ones Noium Trigger nodes registered",
				action: 'Get many webhooks',
			},
		],
		default: 'getAll',
	},
];

export const webhookFields: INodeProperties[] = [
	{
		displayName: 'Webhook ID',
		name: 'webhookId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['webhook'], operation: ['get'] } },
		description: 'The ID of the webhook',
	},
	...getManyFields('webhook'),
];

const getWebhook: NoiumOperation = async function (itemIndex) {
	const webhookId = getPathId.call(this, 'webhookId', 'Webhook ID', itemIndex);
	const webhook = await noiumApiRequest.call(
		this,
		{ method: 'GET', path: `/v1/webhooks/${webhookId}` },
		itemIndex,
	);
	return toOutputItems.call(this, webhook, itemIndex);
};

// The API returns every webhook at once (an organization has at most 10), so "Limit" applies here.
const getWebhooks: NoiumOperation = async function (itemIndex) {
	const { returnAll, limit } = getPaging.call(this, itemIndex);
	const { data = [] } = (await noiumApiRequest.call(
		this,
		{ method: 'GET', path: '/v1/webhooks' },
		itemIndex,
	)) as { data?: IDataObject[] };
	return toOutputItems.call(this, returnAll ? data : data.slice(0, limit), itemIndex);
};

export const webhookActions: Record<string, NoiumOperation> = {
	get: getWebhook,
	getAll: getWebhooks,
};
