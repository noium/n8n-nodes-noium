import type { INodeProperties } from 'n8n-workflow';

import { noiumApiRequestAllItems } from '../GenericFunctions';
import type { NoiumOperation } from './common';
import { getFilters, getManyFields, getPaging, toOutputItems } from './common';

export const counterpartyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['counterparty'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description:
					"Get your organization's counterparties (the suppliers and customers on its invoices) with their bank accounts",
				action: 'Get many counterparties',
			},
		],
		default: 'getAll',
	},
];

export const counterpartyFields: INodeProperties[] = [
	...getManyFields('counterparty'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['counterparty'], operation: ['getAll'] } },
		options: [
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Name, registration number or VAT ID to search for',
			},
		],
	},
];

const getCounterparties: NoiumOperation = async function (itemIndex) {
	const counterparties = await noiumApiRequestAllItems.call(
		this,
		'/v1/counterparties',
		getFilters.call(this, itemIndex),
		itemIndex,
		{ ...getPaging.call(this, itemIndex), maxPageSize: 100 },
	);
	return toOutputItems.call(this, counterparties, itemIndex);
};

export const counterpartyActions: Record<string, NoiumOperation> = {
	getAll: getCounterparties,
};
