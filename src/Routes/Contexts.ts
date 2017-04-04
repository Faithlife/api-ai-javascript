import { IServerResponse, IStringMap } from '../Interfaces';
import Request from '../Models/Request';
import XhrRequest from '../XhrRequest';

interface IParameter {
	name: string;
	value: string;
}

interface IContext {
	name: string;
	lifespan?: number;
	parameters?: IParameter[];
}

class ContextsRequest extends Request {
	constructor(
		uri: string,
		method: XhrRequest.Method,
		payload: IContext[],
		headers: IStringMap) {
		super(uri, method, payload, headers);
	}
}

export class ContextsRequestFactory {
	private readonly baseUri;

	constructor(
		apiBaseUri: string,
		private readonly apiVersion: string,
		private readonly sessionId: string,
		private readonly headers: IStringMap) {
		this.baseUri = `${apiBaseUri}/contexts`;
	}

	public all(): Promise<IServerResponse> {
		const { apiVersion, sessionId, baseUri, headers } = this;
		const uri = `${baseUri}?v=${apiVersion}&sessionId=${sessionId}`;
		return new ContextsRequest(uri, XhrRequest.Method.GET, null, headers).perform();
	}

	public get(name: string): Promise<IServerResponse> {
		const { apiVersion, sessionId, baseUri, headers } = this;
		const uri = `${baseUri}/${name}?v=${apiVersion}&sessionId=${sessionId}`;
		return new ContextsRequest(uri, XhrRequest.Method.GET, null, headers).perform();
	}

	public post(contexts: IContext[]): Promise<IServerResponse> {
		const { apiVersion, sessionId, baseUri, headers } = this;
		const uri = `${baseUri}?v=${apiVersion}&sessionId=${sessionId}`;
		return new ContextsRequest(uri, XhrRequest.Method.POST, contexts, headers).perform();
	}

	public delete(name: string): Promise<IServerResponse> {
		const { apiVersion, sessionId, baseUri, headers } = this;
		const uri = `${this.baseUri}/${name}?v=${apiVersion}&sessionId=${sessionId}`;
		return new ContextsRequest(uri, XhrRequest.Method.DELETE, null, headers).perform();
	}

	public deleteAll(): Promise<IServerResponse> {
		const { apiVersion, sessionId, baseUri, headers } = this;
		const uri = `${this.baseUri}?v=${apiVersion}&sessionId=${sessionId}`;
		return new ContextsRequest(uri, XhrRequest.Method.DELETE, null, headers).perform();
	}
}
