import { INodeProperties } from "n8n-workflow";

const displayOptionsEmailsGetMany = {
    resource: ['emails'],
    operation: ['getMany']
}

export const emailsGetManyDescription: INodeProperties [] = [
    {
        displayName: 'Received From',
        name : 'received_from',
        type: 'string',
        default:'',
        displayOptions: {
            show: {
                ...displayOptionsEmailsGetMany
            }
        },
        routing: {
            send: {
                type: 'query',
                property: 'received_from'
            }
        }
    },
    {
        displayName: 'Received To',
        name : 'received_to',
        type: 'string',
        default:'',
        displayOptions: {
            show: {
                ...displayOptionsEmailsGetMany
            }
        },
        routing: {
            send: {
                type: 'query',
                property: 'received_to'
            }
        }
    },
    {
        displayName: "Has Documents",
        name: 'has_documents',
        type: 'boolean',
        default: false,
        displayOptions: {
            show: {
                ...displayOptionsEmailsGetMany
            }
        },
        description: 'Whether the email has documents',
        routing: {
            send: {
                type: 'query',
                property: 'has_documents',
            },
        },
    },
    {
        displayName: 'Include Parent with Childs',
        name: 'include_parent_with_childs',
        type: 'boolean',
        default: false,
        displayOptions: {
            show: {
                ...displayOptionsEmailsGetMany
            }
        },
        description: 'Whether the email should include the parent with the child emails',
        routing: {
            send: {
                type: 'query',
                property: 'include_parent_with_childs',
            },
        },
    },
    {
        displayName: 'Include Type',
        name: 'include_type',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                ...displayOptionsEmailsGetMany
            }
        },
        description: 'The document types to include',
        routing: {
            send: {
                type: 'query',
                property: 'include_type',
            },
        },
    },
]