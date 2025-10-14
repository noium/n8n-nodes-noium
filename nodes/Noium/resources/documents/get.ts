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
        displayName: 'Document ID',
        name: 'document_id',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                ...displayOptionsDocumentsGet
            }
        },
        description: "The document's ID to retrieve",
        routing: {
            send: {
                type: 'query',
                property: 'document_id'
            }
        }

    }
]