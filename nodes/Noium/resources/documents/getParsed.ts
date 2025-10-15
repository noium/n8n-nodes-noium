import { INodeProperties } from "n8n-workflow";

const displayOptionsDocumentsParsed = {
    resource: ['documents'],
    operation: ['getParsed']
}

export const documentsGetParsedDescription: INodeProperties[] = [
       {
        displayName: 'Document ID',
        name: 'document_id',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
            show: {
                ...displayOptionsDocumentsParsed
            },
        },
        description: "The ID of the document to retrieve",
        routing: {
            send: {
                type: 'query',
                property: 'document_id',
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
                ...displayOptionsDocumentsParsed,
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