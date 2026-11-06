import type { INodeProperties } from 'n8n-workflow';

import { noiumApiRequest, noiumApiRequestAllItems } from '../GenericFunctions';
import type { NoiumOperation } from './common';
import { getFilters, getManyFields, getPaging, getPathId, toOutputItems } from './common';

export const clientOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['client'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get a client of your organization',
				action: 'Get a client',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: "Get your organization's clients, newest first",
				action: 'Get many clients',
			},
		],
		default: 'getAll',
	},
];

export const clientFields: INodeProperties[] = [
	{
		displayName: 'Client ID',
		name: 'clientId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['client'], operation: ['get'] } },
		description: 'The ID of the client',
	},
	...getManyFields('client'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['client'], operation: ['getAll'] } },
		options: [
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Company name or registration number to search for',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Revoked', value: 'revoked' },
					{ name: 'Terminated', value: 'terminated' },
				],
				default: 'active',
				description: 'Only clients with this status',
			},
		],
	},
];

const getClient: NoiumOperation = async function (itemIndex) {
	const clientId = getPathId.call(this, 'clientId', 'Client ID', itemIndex);
	const client = await noiumApiRequest.call(
		this,
		{ method: 'GET', path: `/v1/organization/clients/${clientId}` },
		itemIndex,
	);
	return toOutputItems.call(this, client, itemIndex);
};

const getClients: NoiumOperation = async function (itemIndex) {
	const clients = await noiumApiRequestAllItems.call(
		this,
		'/v1/organization/clients',
		getFilters.call(this, itemIndex),
		itemIndex,
		{ ...getPaging.call(this, itemIndex), maxPageSize: 100 },
	);
	return toOutputItems.call(this, clients, itemIndex);
};

export const clientActions: Record<string, NoiumOperation> = {
	get: getClient,
	getAll: getClients,
};
