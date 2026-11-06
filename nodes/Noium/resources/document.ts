import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { buildMultipartBody, noiumApiRequest } from '../GenericFunctions';
import type { NoiumOperation } from './common';
import { getPathId } from './common';

const showForUpload = { resource: ['document'], operation: ['upload'] };
const showForGet = { resource: ['document'], operation: ['get'] };

export const documentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['document'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get a document and, optionally, its file',
				action: 'Get a document',
			},
			{
				name: 'Upload',
				value: 'upload',
				description: 'Create a document by uploading a file',
				action: 'Upload a document',
			},
		],
		default: 'upload',
	},
];

// Values accepted by POST /v1/documents (see https://api.noium.com/docs), labelled as in the Noium app.
const documentTypeOptions = [
	{ name: 'Agreement', value: 'contract' },
	{ name: 'Audit File', value: 'audit_file' },
	{ name: 'Bank Statement', value: 'bank_statement' },
	{ name: 'CMR', value: 'cmr' },
	{ name: 'Completion and Acceptance', value: 'completion_and_acceptance' },
	{ name: 'Credit Note', value: 'credit_note' },
	{ name: 'Delivery Note', value: 'delivery_note' },
	{ name: 'Financial Reporting', value: 'financial_reporting' },
	{ name: 'Fixed Asset Document', value: 'fixed_asset_document' },
	{ name: 'Insurance Certificate', value: 'insurance_certificate' },
	{ name: 'Invoice', value: 'invoice' },
	{ name: 'Legal Document', value: 'legal_document' },
	{ name: 'Order', value: 'order' },
	{ name: 'Other', value: 'other' },
	{ name: 'Payment Confirmation', value: 'payment_confirmation' },
	{ name: 'Payroll Record', value: 'payroll_record' },
	{ name: 'Profit and Loss Statement', value: 'profit_and_loss_statement' },
	{ name: 'Proforma', value: 'proforma' },
	{ name: 'Receipt', value: 'receipt' },
	{ name: 'Reconciliation Act', value: 'reconciliation_act' },
	{ name: 'Tax Document', value: 'tax_document' },
];

const documentCategoryOptions = [
	{ name: 'Bank and Cash Operations', value: 'bank_and_cash_operations' },
	{ name: 'Corporate Governance', value: 'corporate_governance' },
	{ name: 'Employment Agreements', value: 'employment_agreements' },
	{ name: 'Expense', value: 'expense' },
	{ name: 'Financial Reporting', value: 'financial_reporting' },
	{ name: 'Fixed Assets and Depreciation', value: 'fixed_assets_and_depreciation' },
	{ name: 'Insurance and Risk Management', value: 'insurance_and_risk_management' },
	{ name: 'Loans and Financing', value: 'loans_and_financing' },
	{ name: 'Payroll and Salaries', value: 'payroll_and_salaries' },
	{ name: 'Procurement and Orders', value: 'procurement_and_orders' },
	{ name: 'Purchase Agreements', value: 'supplier_agreements' },
	{ name: 'Reconciliation', value: 'reconciliation_and_matching' },
	{ name: 'Revenue', value: 'revenue' },
	{ name: 'Sales Agreements', value: 'client_agreements' },
	{ name: 'Taxes and Compliance', value: 'taxes_and_compliance' },
	{ name: 'Transport Documents', value: 'transportation_documents' },
	{ name: 'Unclassified', value: 'unclassified' },
];

export const documentFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                document:upload                             */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		displayOptions: { show: showForUpload },
		hint: 'The name of the input binary field containing the file to upload',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showForUpload },
		options: [
			{
				displayName: 'Category',
				name: 'category',
				type: 'options',
				options: documentCategoryOptions,
				default: 'expense',
				description: 'The accounting category to file the document under',
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: '',
				placeholder: 'e.g. invoice.pdf',
				description:
					'The name to give the document in Noium. Defaults to the name of the input file.',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: documentTypeOptions,
				default: 'invoice',
				description: 'The document type',
			},
		],
	},

	/* -------------------------------------------------------------------------- */
	/*                                 document:get                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Document ID',
		name: 'documentId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showForGet },
		placeholder: 'e.g. 3f2b8c1e-6d4a-4b7e-9a51-2c8d0e6f1a90',
		description: 'The ID of the document to get, as returned when it was uploaded',
	},
	{
		displayName: 'Download File',
		name: 'download',
		type: 'boolean',
		default: false,
		displayOptions: { show: showForGet },
		description: "Whether to download the document's file and add it to the output as binary data",
	},
	{
		displayName: 'Put Output File in Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		displayOptions: { show: { ...showForGet, download: [true] } },
		hint: 'The name of the output binary field to put the file in',
	},
];

type UploadAdditionalFields = { type?: string; category?: string; fileName?: string };

// n8n's own missing-binary error doesn't say which binary fields the item does have, and those
// names are what a user needs to set Input Binary Field right (email triggers use attachment_0, …).
function assertInputFile(
	this: IExecuteFunctions,
	itemIndex: number,
	binaryPropertyName: string,
): void {
	if (!binaryPropertyName) {
		throw new NodeOperationError(this.getNode(), 'Input Binary Field must not be empty', {
			itemIndex,
			description:
				'Set it to the name of the input binary field that holds the file, usually "data".',
		});
	}

	const binaryFields = Object.keys(this.getInputData()[itemIndex]?.binary ?? {});
	if (binaryFields.includes(binaryPropertyName)) return;

	if (binaryFields.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'No file to upload: the input item has no binary data',
			{
				itemIndex,
				description:
					'Put a node that outputs a file before this one, e.g. HTTP Request with Response Format set to File, Read/Write Files from Disk, Google Drive → Download, or an email trigger that downloads attachments.',
			},
		);
	}

	throw new NodeOperationError(
		this.getNode(),
		`No file to upload: the input item has no binary field "${binaryPropertyName}"`,
		{
			itemIndex,
			description: `The item's binary fields are ${binaryFields.map((field) => `"${field}"`).join(', ')}. Set Input Binary Field to the one that holds the file.`,
		},
	);
}

async function uploadDocument(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	// An expression can resolve to nothing; that reads as an empty field, not a crash.
	const binaryPropertyName = String(
		this.getNodeParameter('binaryPropertyName', itemIndex) ?? '',
	).trim();
	const { type, category, fileName } = this.getNodeParameter(
		'additionalFields',
		itemIndex,
	) as UploadAdditionalFields;

	assertInputFile.call(this, itemIndex, binaryPropertyName);
	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const content = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
	if (content.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			`The file in input binary field "${binaryPropertyName}" is empty`,
			{ itemIndex, description: 'Noium only accepts files with content.' },
		);
	}

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

	return [{ json: document, pairedItem: { item: itemIndex } }];
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
): Promise<INodeExecutionData[]> {
	const documentId = getPathId.call(this, 'documentId', 'Document ID', itemIndex);
	const document = await noiumApiRequest.call(
		this,
		{ method: 'GET', path: `/v1/documents/${documentId}` },
		itemIndex,
	);

	if (!(this.getNodeParameter('download', itemIndex) as boolean)) {
		return [{ json: document, pairedItem: { item: itemIndex } }];
	}

	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const content = await downloadDocumentFile.call(this, document, itemIndex);
	const binaryData = await this.helpers.prepareBinaryData(
		content,
		(document.originalFilename as string | null) ?? (document.name as string),
		(document.mimeType as string | null) ?? undefined,
	);

	return [
		{
			json: document,
			binary: { [binaryPropertyName]: binaryData },
			pairedItem: { item: itemIndex },
		},
	];
}

export const documentActions: Record<string, NoiumOperation> = {
	upload: uploadDocument,
	get: getDocument,
};
