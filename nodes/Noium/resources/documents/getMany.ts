import type { INodeProperties } from "n8n-workflow";

const displayOptionsDocuments = {
    resource: ['documents'],
    operation: ['getAll']
}


export const documentsGetManyDescription: INodeProperties[] = [
    {
        displayName: 'Organization ID',
        name: 'orgId',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                ...displayOptionsDocuments
            }
        },
        description: "The organization's ID to retrieve",
        routing: {
            send: {
                type: 'query',
                property: 'orgId',
            }
        }
        
    },
    {
        displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
         displayOptions: {
            show: {
                ...displayOptionsDocuments
            }
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
                        type:'body',
                        property: 'type'
                    }
                }
            },
            {
                displayName: 'Category',
                name: 'category',
                type: 'string',
                default: '',
                description: 'The category of the document to recieve',
                routing: {
                    send: {
                        type: 'body',
                        property: 'category'
                    }
                }
            },
            {
                displayName: 'Created To',
                name: 'createdTo',
                type: 'dateTime',
                default: '',
                description: 'The date to which the document could have been created',
                routing: {
                    send: {
                        type: 'body',
                        property: 'createdTo'
                    }
                },
            },
            {
                displayName: 'Created From',
                name: 'createdFrom',
                type: 'dateTime',
                default: '',
                description: 'The date from which the document could have been created',
                routing: {
                    send: {
                        type: 'body',
                        property: 'createdFrom'
                    }
                },
            },
        ],
    },
]

