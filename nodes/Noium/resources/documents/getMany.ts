import type { INodeProperties } from "n8n-workflow";

const displayOptionsDocuments = {
    resource: ['documents'],
    operation: ['getAll']
}


export const documentsGetManyDescription: INodeProperties[] = [
    {
        displayName: 'Organization ID',
        name: 'organization_id',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['documents'] //show to documentsGet as well
            },
        },
        description: "The organization's ID to retrieve",
        routing: {
            send: {
                type:  'query',
                property: 'organization_id',
            },
        },
    },
    {
        displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
         displayOptions: {
            show: {
                ...displayOptionsDocuments,
            },
        },
		options: [
            {
                displayName: 'Type',
                name: 'type',
                type: 'string',
                default: '',
                description: "The type of the document to recieve",
                routing: {
                    send: {
                        type: 'body',
                        property: 'type',
                    },
                },
            },
            {
                displayName: 'Category',
                name: 'category',
                type: 'string',
                default: '',
                description: 'The category of the document to recieve',
                routing: {
                    send: {
                        type: 'body',
                        property: 'category',
                    },
                },
            },
            {
                displayName: 'Created To',
                name: 'created_to',
                type: 'string', //chose string because the date picker kept keeping the hours
                default: '',
                description: 'Enter the date in the yyyy-MM-dd format',
                routing: {
                    send: {
                        type: 'body',
                        property: 'created_to',
                    },
                },
            },
            {
                displayName: 'Created From',
                name: 'created_from',
                type: 'string', //chose string because the date picker kept keeping the hours
                default: '',
                description: 'Enter the date in the yyyy-MM-dd format',
                routing: {
                    send: {
                        type: 'body',
                        property: 'created_from',
                    },
                },
            },
        ],
    },
]
