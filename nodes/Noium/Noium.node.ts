import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { clientActions, clientFields, clientOperations } from './resources/client';
import type { NoiumOperation } from './resources/common';
import {
	conversationActions,
	conversationFields,
	conversationOperations,
} from './resources/conversation';
import {
	counterpartyActions,
	counterpartyFields,
	counterpartyOperations,
} from './resources/counterparty';
import { documentActions, documentFields, documentOperations } from './resources/document';
import {
	goodOrServiceActions,
	goodOrServiceFields,
	goodOrServiceOperations,
} from './resources/goodOrService';
import { invoiceActions, invoiceFields, invoiceOperations } from './resources/invoice';
import { webhookActions, webhookFields, webhookOperations } from './resources/webhook';

const actions: Record<string, Record<string, NoiumOperation>> = {
	client: clientActions,
	conversation: conversationActions,
	counterparty: counterpartyActions,
	document: documentActions,
	goodOrService: goodOrServiceActions,
	invoice: invoiceActions,
	webhook: webhookActions,
};

export class Noium implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Noium',
		name: 'noium',
		icon: { light: 'file:noium.svg', dark: 'file:noium.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Work with documents, invoices, conversations, clients and more in Noium',
		defaults: {
			name: 'Noium',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'noiumApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Client', value: 'client' },
					{ name: 'Conversation', value: 'conversation' },
					{ name: 'Counterparty', value: 'counterparty' },
					{ name: 'Document', value: 'document' },
					{ name: 'Good or Service', value: 'goodOrService' },
					{ name: 'Invoice', value: 'invoice' },
					{ name: 'Webhook', value: 'webhook' },
				],
				// Saved workflows omit parameters left at their default, so this stays "document".
				default: 'document',
			},
			...clientOperations,
			...clientFields,
			...conversationOperations,
			...conversationFields,
			...counterpartyOperations,
			...counterpartyFields,
			...documentOperations,
			...documentFields,
			...goodOrServiceOperations,
			...goodOrServiceFields,
			...invoiceOperations,
			...invoiceFields,
			...webhookOperations,
			...webhookFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;
				const action = actions[resource]?.[operation];
				if (!action) {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported for resource "${resource}"`,
						{ itemIndex },
					);
				}

				returnData.push(...(await action.call(this, itemIndex)));
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				// Both constructors return an error of their own class unchanged.
				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}

		return [returnData];
	}
}
