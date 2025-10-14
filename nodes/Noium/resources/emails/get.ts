import { INodeProperties } from "n8n-workflow";

const displayOptionsEmailsGet = {
    resource: ['emails'],
    operation: ['get']
}

export const emailsGetDescription : INodeProperties [] = [
    {
        displayName: "Email ID",
        name: 'email_id',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                ...displayOptionsEmailsGet
            }
        },
        description: 'ID of the email to retrieve',
        routing: {
            send: {
                type: 'query',
                property: 'email_id',
            },
        },
    },
    {
        displayName: "Has Documents",
        name: 'has_documents',
        type: 'boolean',
        default: false,
        displayOptions: {
            show: {
                ...displayOptionsEmailsGet
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
                ...displayOptionsEmailsGet
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
                ...displayOptionsEmailsGet
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