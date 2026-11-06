import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

// Runs one operation for one input item and returns its output items.
export type NoiumOperation = (
	this: IExecuteFunctions,
	itemIndex: number,
) => Promise<INodeExecutionData[]>;

// A required ID parameter as a URL path segment. Empty is a configuration error, not a request to send.
export function getPathId(
	this: IExecuteFunctions,
	parameterName: string,
	label: string,
	itemIndex: number,
): string {
	const value = String(this.getNodeParameter(parameterName, itemIndex) ?? '').trim();
	if (!value) {
		throw new NodeOperationError(this.getNode(), `${label} must not be empty`, { itemIndex });
	}
	return encodeURIComponent(value);
}

export function toOutputItems(
	this: IExecuteFunctions,
	data: IDataObject | IDataObject[],
	itemIndex: number,
): INodeExecutionData[] {
	return this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(data), {
		itemData: { item: itemIndex },
	});
}

// "Return All" and "Limit" for a Get Many operation of `resource`.
export const getManyFields = (resource: string): INodeProperties[] => [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: [resource], operation: ['getAll'] } },
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		displayOptions: { show: { resource: [resource], operation: ['getAll'], returnAll: [false] } },
		description: 'Max number of results to return',
	},
];

// A Get Many's "Filters" collection as query parameters, leaving out fields added but left empty
// (the API rejects an empty search).
export function getFilters(this: IExecuteFunctions, itemIndex: number): IDataObject {
	const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;
	return Object.fromEntries(
		Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined),
	);
}

export function getPaging(this: IExecuteFunctions, itemIndex: number) {
	const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
	const limit = returnAll ? 0 : (this.getNodeParameter('limit', itemIndex) as number);
	return { returnAll, limit };
}
