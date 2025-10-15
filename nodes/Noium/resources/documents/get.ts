import type { INodeProperties } from "n8n-workflow";

const displayOptionsDocumentsGet = {
    resource: ['documents'],
    operation: ['get']
}

export const documentsGetDescription: INodeProperties[] = [
    {
        displayName: 'Organization ID',
        name: 'organization_id',
        type: 'string',
        default: '',
        required : true,
        displayOptions: {
            show: {
                ...displayOptionsDocumentsGet
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
                ...displayOptionsDocumentsGet,
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
        ], 
    },
    
]