import type { INodeProperties } from 'n8n-workflow';
import { clientsGetDescription } from './get';

const showOnlyForClients = {
	resource: ['clients'],
};

export const clientsDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForClients,
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get client',
				description: 'Retrieve client information',
				routing: {
					request: {
						method: 'GET',
						url: '/client',
					},
				},
			},
		],
		default: 'get',
	},
	...clientsGetDescription,
];
