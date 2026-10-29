import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class NoiumApi implements ICredentialType {
	name = 'noiumApi';

	displayName = 'Noium API';

	icon: Icon = {
		light: 'file:../nodes/Noium/noium.svg',
		dark: 'file:../nodes/Noium/noium.dark.svg',
	};

	documentationUrl = 'https://github.com/noium/n8n-nodes-noium?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Create a key in Noium under Organization settings → API keys. Give it the documents:upload and documents:get scopes, plus organization:get to test the connection.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: 'https://api.noium.com',
			description: 'Change only to connect to a non-production Noium environment',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
			url: '/v1/organization',
		},
		rules: [
			{
				type: 'responseCode',
				properties: {
					value: 401,
					message: 'The API key is invalid or has been revoked',
				},
			},
			{
				type: 'responseCode',
				properties: {
					value: 403,
					message:
						'The API key is valid but lacks the organization:get scope used to test it. You can still save and use it.',
				},
			},
		],
	};
}
