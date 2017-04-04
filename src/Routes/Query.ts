import { ApiAiConstants } from '../ApiAiConstants';
import { ApiAiRequestError } from '../Errors';
import { ICancellationToken, IServerResponse, IStringMap } from '../Interfaces';
import { IEntity } from '../Models/Entity';
import Request from '../Models/Request';
import XhrRequest from '../XhrRequest';

interface IParameter {
	parameter_name: string;
	parameter_value: string;
}

interface IContext {
	name?: string;
	parameters?: IParameter[];
	lifespan?: number;
}

export interface IQueryRequestPayloadBase {
	sessionId: string;
	lang: ApiAiConstants.AVAILABLE_LANGUAGES;
}

interface IQueryRequestDtoBase {
	sessionId: string;
	lang: ApiAiConstants.AVAILABLE_LANGUAGES;
	contexts?: IContext[];
	resetContexts?: boolean;
	entities?: IEntity[];
	timezone?: string;
	location?: {
		latitude: number,
		longitude: number,
	};
	originalRequest?: {
		source?: string,
		data?: object,
	};
}

export interface IQueryTextRequestDto extends IQueryRequestDtoBase {
	query: string;
}

export interface IQueryEventRequestDto extends IQueryRequestDtoBase {
	event: {
		name: string,
		data?: IStringMap
	};
}

type IQueryRequestPayload = (IQueryEventRequestDto | IQueryTextRequestDto) & IQueryRequestPayloadBase;

class QueryRequest extends Request {
	constructor(uri: string, payload: IQueryRequestPayload, headers: IStringMap) {
		super(uri, XhrRequest.Method.POST, payload, headers);
	}
}

export class QueryRequestFactory {
	private readonly uri;

	constructor(
		apiBaseUri: string,
		apiVersion: string,
		private readonly basePayload: IQueryRequestPayloadBase,
		private readonly headers: IStringMap) {
		this.uri = `${apiBaseUri}/query?v=${apiVersion}`;
	}

	public text(dto: IQueryTextRequestDto, token: ICancellationToken = null): Promise<IServerResponse> {
		if (!dto || !dto.query || !dto.query.length) {
			throw new ApiAiRequestError('Query should not be empty');
		}
		const { basePayload, uri, headers } = this;
		const payload: IQueryRequestPayload = {
			...basePayload,
			...dto,
		};
		return new QueryRequest(uri, payload, headers).perform(token);
	}

	public event(dto: IQueryEventRequestDto, token: ICancellationToken = null): Promise<IServerResponse> {
		if (!dto || !dto.event || !dto.event.name || !dto.event.name.length) {
			throw new ApiAiRequestError('Event name can not be empty');
		}
		const { basePayload, uri, headers } = this;
		const payload: IQueryRequestPayload = {
			...basePayload,
			...dto,
		};
		return new QueryRequest(uri, payload, headers).perform(token);
	}
}
