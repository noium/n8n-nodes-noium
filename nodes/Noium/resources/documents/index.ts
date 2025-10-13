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
                description: 'Get documents',
                routing: {
                    request: {
                        method: 'POST',
                        url: '/documents',
                        headers: {
                            'Content-type': 'application/json',

                        },
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
                        method: 'POST',
                        url: '/document',
                        headers: {
                            'X-HTTP-Method-Override': 'GET',
                            'Content-type': 'application/json',
                        },
                        qs: {organization_id:'={{ $parameter.orgId }}'},

                    },
                },
            },
        ],
    },
    ...documentsGetManyDescription
]