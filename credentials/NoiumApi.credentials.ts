import type {
	IAuthenticateGeneric,
	// ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class NoiumApi implements ICredentialType {
	name = 'noiumApi';

	displayName = 'Noium API';

	// Link to your community node's README
	documentationUrl = 'https://github.com/org/-noium?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Authorization': '={{$credentials.apiKey}}',
			},
		},
	};

	// test: ICredentialTestRequest = {
	// 	request: {
	// 		baseURL: 'https://operations.noium.com/webhook/api',
	// 		url: '/client',
	// 	},
	// };
}
