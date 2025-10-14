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
        displayName: 'Type',
        name: 'type',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                ...displayOptionsDocumentsParsed
            },
        },
        description: 'The type of document to retrieve',
        routing: {
            send: {
                type: 'body',
                property: 'type'
            }
        }
    }
    
    
]