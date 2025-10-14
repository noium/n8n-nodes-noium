import { type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { documentsDescription } from './resources/documents';
import { clientsDescription } from './resources/clients';
import { emailsDescription } from './resources/emails';

export class Noium implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Noium',
		name: 'noium',
		icon: { light: 'file:noium.svg', dark: 'file:noium.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Noium API',
		defaults: {
			name: 'Noium',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'noiumApi', required: true }],
		requestDefaults: {
			baseURL: 'https://operations.noium.com/webhook/api',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Document',
						value: 'documents',
					},
					{
						name: 'Client',
						value: 'clients',
					},
					{
						name: 'Email',
						value: 'emails'
					}
				],
				default: 'clients',
			},
			...documentsDescription,
			...clientsDescription,
			...emailsDescription
		],
	};
}
