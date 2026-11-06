import type { INodeProperties } from 'n8n-workflow';

import { noiumApiRequest } from '../GenericFunctions';
import type { NoiumOperation } from './common';
import { getPathId, toOutputItems } from './common';

export const invoiceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['invoice'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get an invoice with its lines and their dimension values',
				action: 'Get an invoice',
			},
		],
		default: 'get',
	},
];

export const invoiceFields: INodeProperties[] = [
	{
		displayName: 'Invoice ID',
		name: 'invoiceId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['invoice'], operation: ['get'] } },
		description: 'The ID of the invoice',
	},
];

const getInvoice: NoiumOperation = async function (itemIndex) {
	const invoiceId = getPathId.call(this, 'invoiceId', 'Invoice ID', itemIndex);
	const invoice = await noiumApiRequest.call(
		this,
		{ method: 'GET', path: `/v1/invoices/${invoiceId}` },
		itemIndex,
	);
	return toOutputItems.call(this, invoice, itemIndex);
};

export const invoiceActions: Record<string, NoiumOperation> = {
	get: getInvoice,
};
