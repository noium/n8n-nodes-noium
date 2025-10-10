import type { INodeProperties } from "n8n-workflow";
import { documentsGetManyDescription } from "./getMany";

const showOnlyForDocuments = {
    resource: ['documents'],
};

export const documentsDescription: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        default: 'get',
        noDataExpression:true,
        displayOptions: {
            show: showOnlyForDocuments
        },
        options: [
            {
                name: 'Get Many',
                value: 'getAll',
                action: 'Get documents',
                description: 'Get companies',
                routing: {
                    request: {
                        method: 'GET',
                        url: '/documents'
                    },
                },

            },
            {
                name: 'Get',
                value: 'get',
                action: 'Get a document',
                description: 'Get a single document',
                routing: {
                    request: {
                        method: 'GET',
                        url: '/document',
                    },
                },
            },
        ],
    },
    ...documentsGetManyDescription
]