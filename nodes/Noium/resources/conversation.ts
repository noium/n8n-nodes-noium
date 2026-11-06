import type { INodeProperties } from 'n8n-workflow';

import { noiumApiRequest, noiumApiRequestAllItems } from '../GenericFunctions';
import type { NoiumOperation } from './common';
import { getFilters, getManyFields, getPaging, getPathId, toOutputItems } from './common';

export const conversationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['conversation'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description:
					"Get your organization's conversations with their messages, most recently updated first",
				action: 'Get many conversations',
			},
			{
				name: 'Get Message',
				value: 'getMessage',
				description: 'Get one message of a conversation, including its body',
				action: 'Get a conversation message',
			},
		],
		default: 'getAll',
	},
];

export const conversationFields: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['conversation'], operation: ['getMessage'] } },
		description: 'The ID of the conversation the message belongs to',
	},
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['conversation'], operation: ['getMessage'] } },
		description: 'The ID of the message',
	},
	...getManyFields('conversation'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['conversation'], operation: ['getAll'] } },
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Closed', value: 'closed' },
					{ name: 'Open', value: 'open' },
				],
				default: 'open',
				description: 'Only open or only closed conversations',
			},
		],
	},
];

const getConversations: NoiumOperation = async function (itemIndex) {
	const conversations = await noiumApiRequestAllItems.call(
		this,
		'/v1/conversations',
		getFilters.call(this, itemIndex),
		itemIndex,
		{ ...getPaging.call(this, itemIndex), maxPageSize: 50 },
	);
	return toOutputItems.call(this, conversations, itemIndex);
};

const getConversationMessage: NoiumOperation = async function (itemIndex) {
	const conversationId = getPathId.call(this, 'conversationId', 'Conversation ID', itemIndex);
	const messageId = getPathId.call(this, 'messageId', 'Message ID', itemIndex);
	const message = await noiumApiRequest.call(
		this,
		{ method: 'GET', path: `/v1/conversations/${conversationId}/messages/${messageId}` },
		itemIndex,
	);
	return toOutputItems.call(this, message, itemIndex);
};

export const conversationActions: Record<string, NoiumOperation> = {
	getAll: getConversations,
	getMessage: getConversationMessage,
};
