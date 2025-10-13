import type { INodeProperties } from "n8n-workflow";

const displayOptionsDocumentsGet = {
    resource: ['documents'],
    operation: ['get']
}

export const documentsGetDescription: INodeProperties[] = [
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
                type: 'body',
                property: 'document_id'
            }
        }

    }
]