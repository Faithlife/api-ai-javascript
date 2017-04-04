import { IServerResponse, IStringMap } from '../Interfaces';
import { IEntity } from '../Models/Entity';
import Request from '../Models/Request';
import XhrRequest from '../XhrRequest';

interface IUserEntitiesRequestPayloadBase {
	sessionId: string;
}

interface IUserEntitiesCreatePayload extends IUserEntitiesRequestPayloadBase {
	entities: IEntity[];
}

interface IUserEntitiesUpdatePayload extends IUserEntitiesRequestPayloadBase {
	name: string;
	extend?: boolean;
	entries: IEntity.IEntry[];
}

class UserEntitiesRequest extends Request {
	constructor(
		uri: string,
		method: XhrRequest.Method,
		payload: (IUserEntitiesCreatePayload | IUserEntitiesUpdatePayload),
		headers: IStringMap) {
		super(uri, method, payload, headers);
	}
}

export class UserEntitiesRequestFactory {
	private readonly baseUri;

	constructor(
		apiBaseUri: string,
		private readonly apiVersion: string,
		private readonly sessionId: string,
		private readonly headers: IStringMap) {
		this.baseUri = `${apiBaseUri}/userEntities`;
	}

	public create(entities: IEntity[]): Promise<IServerResponse> {
		const { apiVersion, sessionId, baseUri, headers } = this;
		const uri = `${baseUri}?v=${apiVersion}`;
		const payload: IUserEntitiesCreatePayload = {
			sessionId,
			entities,
		};
		return new UserEntitiesRequest(uri, XhrRequest.Method.POST, payload, headers).perform();
	}

	public get(name: string): Promise<IServerResponse> {
		const { apiVersion, sessionId, baseUri, headers } = this;
		const uri = `${baseUri}/${name}?v=${apiVersion}&sessionId=${sessionId}`;
		return new UserEntitiesRequest(uri, XhrRequest.Method.GET, null, headers).perform();
	}

	public update(name: string, entries: IEntity.IEntry[], extend: boolean = false): Promise<IServerResponse> {
		const { apiVersion, sessionId, baseUri, headers } = this;
		const uri = `${this.baseUri}/${name}?v=${apiVersion}`;
		const payload: IUserEntitiesUpdatePayload = {
			sessionId,
			name,
			extend,
			entries,
		};
		return new UserEntitiesRequest(uri, XhrRequest.Method.PUT, payload, headers).perform();
	}

	public delete(name: string): Promise<IServerResponse> {
		const { apiVersion, sessionId, baseUri, headers } = this;
		const uri = `${this.baseUri}/${name}?v=${apiVersion}&sessionId=${sessionId}`;
		return new UserEntitiesRequest(uri, XhrRequest.Method.DELETE, null, headers).perform();
	}
}
