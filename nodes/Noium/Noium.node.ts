import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { documentFields, documentOperations } from './descriptions/DocumentDescription';
import { buildMultipartBody, noiumApiRequest } from './GenericFunctions';

type UploadAdditionalFields = { type?: string; category?: string; fileName?: string };

async function uploadDocument(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const { type, category, fileName } = this.getNodeParameter(
		'additionalFields',
		itemIndex,
	) as UploadAdditionalFields;

	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const content = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	const fields: Record<string, string> = {};
	if (type) fields.type = type;
	if (category) fields.category = category;

	const { body, contentType } = buildMultipartBody(fields, {
		fieldName: 'file',
		fileName: fileName || binaryData.fileName || 'document',
		mimeType: binaryData.mimeType || 'application/octet-stream',
		content,
	});

	const document = await noiumApiRequest.call(
		this,
		{ method: 'POST', path: '/v1/documents', body, headers: { 'Content-Type': contentType } },
		itemIndex,
	);

	return { json: document, pairedItem: { item: itemIndex } };
}

// The download URL is pre-signed by Noium's file storage, so it is fetched without the API key.
async function downloadDocumentFile(
	this: IExecuteFunctions,
	document: IDataObject,
	itemIndex: number,
): Promise<Buffer> {
	try {
		const file = (await this.helpers.httpRequest({
			method: 'GET',
			url: document.downloadUrl as string,
			encoding: 'arraybuffer',
		})) as ArrayBuffer;
		return Buffer.from(file);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			itemIndex,
			message: "Could not download the document's file",
		});
	}
}

async function getDocument(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const documentId = (this.getNodeParameter('documentId', itemIndex) as string).trim();
	if (!documentId) {
		throw new NodeOperationError(this.getNode(), 'Document ID must not be empty', { itemIndex });
	}

	const document = await noiumApiRequest.call(
		this,
		{ method: 'GET', path: `/v1/documents/${encodeURIComponent(documentId)}` },
		itemIndex,
	);

	if (!(this.getNodeParameter('download', itemIndex) as boolean)) {
		return { json: document, pairedItem: { item: itemIndex } };
	}

	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const content = await downloadDocumentFile.call(this, document, itemIndex);
	const binaryData = await this.helpers.prepareBinaryData(
		content,
		(document.originalFilename as string | null) ?? (document.name as string),
		(document.mimeType as string | null) ?? undefined,
	);

	return {
		json: document,
		binary: { [binaryPropertyName]: binaryData },
		pairedItem: { item: itemIndex },
	};
}

export class Noium implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Noium',
		name: 'noium',
		icon: { light: 'file:noium.svg', dark: 'file:noium.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Upload and get documents in Noium',
		defaults: {
			name: 'Noium',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'noiumApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [{ name: 'Document', value: 'document' }],
				default: 'document',
			},
			...documentOperations,
			...documentFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (resource === 'document' && operation === 'upload') {
					returnData.push(await uploadDocument.call(this, itemIndex));
				} else if (resource === 'document' && operation === 'get') {
					returnData.push(await getDocument.call(this, itemIndex));
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported for resource "${resource}"`,
						{ itemIndex },
					);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				// Both constructors return an error of their own class unchanged.
				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject);
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}

		return [returnData];
	}
}
