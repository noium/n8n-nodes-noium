import type { INodeProperties } from "n8n-workflow";
import { emailsGetDescription } from "./get";
import { emailsGetManyDescription } from "./getMany";

const showOnlyForEmails = {
    resource: ['emails']
};

export const emailsDescription : INodeProperties[] = [
    {
        displayName: "Operation",
        name: 'operation',
        type: 'options',
        default: 'get',
        noDataExpression: true,
        displayOptions : {
            show: {
                ...showOnlyForEmails
            }
        },
        options: [
            {
                name: 'Get Many',
                value: 'getMany',
                action: 'Get emails',
                description: 'Get emails',
                routing: {
                    request: {
                        method: 'GET',
                        url: '/emails',
                        headers: {
                            'Content-type' : 'application/json'
                        },
                    },
                }
            },
            {
                name: 'Get',
                value: 'get',
                action: 'Get an email',
                description: 'Get an email',
                routing: {
                    request: {
                        method: 'GET',
                        url: '/email',
                        headers: {
                            'Content-type' : 'application/json'
                        },
                    }
                }
            }
        ]
    },
    ...emailsGetDescription,
    ...emailsGetManyDescription
]