import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export const DEFAULT_BASE_URL = 'https://api.noium.com';

type NoiumErrorBody = {
	error?: {
		code?: string;
		message?: string;
		details?: Array<{ path?: string; message?: string }>;
	};
};

// Hints for the errors a user can fix in Noium itself; the API's own message says what went wrong.
const ERROR_HINTS: Record<number, string> = {
	401: 'Check the API key in the Noium credentials. Keys are created in Noium under Organization settings → API keys.',
	403: 'Add the missing scope to the API key in Noium under Organization settings → API keys.',
	413: 'Noium accepts files of up to 40 MB.',
	429: 'The API key sent more than 600 requests in a minute. Wait a moment and retry.',
};

/**
 * Calls the Noium public API (`/v1/*`) with the node's credentials. Error responses come back in
 * Noium's `{ error: { code, message, details } }` envelope and are rethrown as a NodeApiError.
 */
export async function noiumApiRequest(
	this: IExecuteFunctions | IHookFunctions,
	options: Omit<IHttpRequestOptions, 'url'> & { path: string },
	itemIndex?: number,
): Promise<IDataObject> {
	const credentials = await this.getCredentials<{ baseUrl?: string }>('noiumApi', itemIndex);
	const baseUrl = (credentials.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
	const { path, ...requestOptions } = options;

	const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'noiumApi', {
		...requestOptions,
		url: `${baseUrl}${path}`,
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	})) as IN8nHttpFullResponse;

	if (response.statusCode < 400) return response.body as IDataObject;

	const body = (
		typeof response.body === 'object' && response.body !== null ? response.body : {}
	) as NoiumErrorBody;
	// Field-level problems of a 400 VALIDATION_ERROR, named by the field they are about, e.g.
	// "documentId: Invalid uuid".
	const details = (body.error?.details ?? [])
		.map((detail) => {
			const field = detail.path?.split(/[./]/).filter(Boolean).pop();
			return [field, detail.message].filter(Boolean).join(': ');
		})
		.join('; ');
	const message =
		body.error?.message ?? `Noium API request failed with status ${response.statusCode}`;
	const code = body.error?.code ? `Error code: ${body.error.code}.` : undefined;

	throw new NodeApiError(this.getNode(), body as JsonObject, {
		itemIndex,
		httpCode: String(response.statusCode),
		message: details ? `${message} (${details})` : message,
		description: [ERROR_HINTS[response.statusCode], code].filter(Boolean).join(' ') || undefined,
	});
}

export const isNotFoundError = (error: unknown) =>
	error instanceof NodeApiError && error.httpCode === '404';

/**
 * Reads a `{ data, total, limit, offset }` list endpoint page by page (`limit`/`offset` query) until
 * everything matching, or `limit` items, has been read.
 */
export async function noiumApiRequestAllItems(
	this: IExecuteFunctions,
	path: string,
	query: IDataObject,
	itemIndex: number,
	{ returnAll, limit, maxPageSize }: { returnAll: boolean; limit: number; maxPageSize: number },
): Promise<IDataObject[]> {
	const results: IDataObject[] = [];
	let offset = 0;

	while (returnAll || results.length < limit) {
		const pageSize = returnAll ? maxPageSize : Math.min(maxPageSize, limit - results.length);
		const page = (await noiumApiRequest.call(
			this,
			{ method: 'GET', path, qs: { ...query, limit: pageSize, offset } },
			itemIndex,
		)) as { data?: IDataObject[]; total?: number };
		const data = page.data ?? [];

		results.push(...data);
		offset += data.length;
		if (data.length < pageSize || (page.total !== undefined && offset >= page.total)) break;
	}

	return results;
}

// How far a webhook's timestamp may be from now, as Standard Webhooks libraries allow.
const WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

/**
 * Verifies a Standard Webhooks request (https://www.standardwebhooks.com), as Noium signs them:
 * `webhook-signature` holds space-separated `v1,<base64 HMAC-SHA256 of "id.timestamp.body">`
 * entries (two during a secret rotation), keyed with the base64 part of the `whsec_…` secret.
 */
export function isValidWebhookSignature(
	secret: string,
	headers: { id?: string; timestamp?: string; signature?: string },
	body: Buffer | string,
	nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
	const { id, timestamp, signature } = headers;
	if (!id || !timestamp || !signature) return false;

	const sentAt = Number(timestamp);
	if (
		!Number.isInteger(sentAt) ||
		Math.abs(nowSeconds - sentAt) > WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS
	) {
		return false;
	}

	const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
	const expected = createHmac('sha256', key).update(`${id}.${timestamp}.`).update(body).digest();

	return signature.split(' ').some((entry) => {
		const [version, value] = entry.split(',');
		if (version !== 'v1' || !value) return false;
		const received = Buffer.from(value, 'base64');
		return received.length === expected.length && timingSafeEqual(received, expected);
	});
}

// Quoted multipart header values: percent-encode the characters that would end the value or the
// header, as browsers do for FormData (WHATWG multipart/form-data encoding).
const escapeHeaderValue = (value: string) =>
	value.replace(/\r/g, '%0D').replace(/\n/g, '%0A').replace(/"/g, '%22');

/**
 * Builds a `multipart/form-data` body with text fields and one file part. Built by hand because
 * community nodes can't ship runtime dependencies such as `form-data`.
 */
export function buildMultipartBody(
	fields: Record<string, string>,
	file: { fieldName: string; fileName: string; mimeType: string; content: Buffer },
): { body: Buffer; contentType: string } {
	const boundary = `----n8nNoiumFormBoundary${randomBytes(16).toString('hex')}`;
	const parts: Buffer[] = [];

	for (const [name, value] of Object.entries(fields)) {
		parts.push(
			Buffer.from(
				`--${boundary}\r\nContent-Disposition: form-data; name="${escapeHeaderValue(name)}"\r\n\r\n${value}\r\n`,
				'utf8',
			),
		);
	}

	parts.push(
		Buffer.from(
			`--${boundary}\r\nContent-Disposition: form-data; name="${escapeHeaderValue(file.fieldName)}"; filename="${escapeHeaderValue(file.fileName)}"\r\nContent-Type: ${file.mimeType.replace(/[\r\n]/g, '')}\r\n\r\n`,
			'utf8',
		),
		file.content,
		Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'),
	);

	return { body: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}
