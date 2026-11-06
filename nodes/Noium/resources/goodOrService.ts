import type { INodeProperties } from 'n8n-workflow';

import { noiumApiRequestAllItems } from '../GenericFunctions';
import type { NoiumOperation } from './common';
import { getFilters, getManyFields, getPaging, toOutputItems } from './common';

export const goodOrServiceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['goodOrService'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description:
					"Get your organization's goods and services catalog with VAT codes and sale and purchase accounts",
				action: 'Get many goods or services',
			},
		],
		default: 'getAll',
	},
];

export const goodOrServiceFields: INodeProperties[] = [
	...getManyFields('goodOrService'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['goodOrService'], operation: ['getAll'] } },
		options: [
			{
				displayName: 'Include Inactive',
				name: 'includeInactive',
				type: 'boolean',
				default: false,
				description: 'Whether to also return deactivated goods and services',
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Name, external ID, product code or barcode to search for',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Good', value: 'item' },
					{ name: 'Service', value: 'service' },
				],
				default: 'service',
				description: 'Only goods or only services',
			},
		],
	},
];

const getGoodsAndServices: NoiumOperation = async function (itemIndex) {
	const { includeInactive, ...filters } = getFilters.call(this, itemIndex);
	const goodsAndServices = await noiumApiRequestAllItems.call(
		this,
		'/v1/goods-services',
		// The API takes the flag as the string "true" or "false".
		includeInactive === undefined
			? filters
			: { ...filters, includeInactive: String(includeInactive) },
		itemIndex,
		{ ...getPaging.call(this, itemIndex), maxPageSize: 100 },
	);
	return toOutputItems.call(this, goodsAndServices, itemIndex);
};

export const goodOrServiceActions: Record<string, NoiumOperation> = {
	getAll: getGoodsAndServices,
};
