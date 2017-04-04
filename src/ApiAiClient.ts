import { ApiAiConstants } from './ApiAiConstants';
import { ApiAiClientConfigurationError } from './Errors';
import { QueryRequestFactory } from './Routes/Query';
import { UserEntitiesRequestFactory } from './Routes/UserEntities';

import { IApiClientOptions, IServerResponse, IStreamClient, IStreamClientConstructor,
	IStreamClientOptions, IStringMap } from './Interfaces';

export * from './Interfaces';
export { ApiAiConstants } from './ApiAiConstants';

export class ApiAiClient {

	public query: QueryRequestFactory;
	public userEntities: UserEntitiesRequestFactory;

	private apiLang: ApiAiConstants.AVAILABLE_LANGUAGES;
	private apiVersion: string;
	private apiBaseUrl: string;
	private sessionId: string;
	private accessToken: string;
	private streamClientClass: IStreamClientConstructor;

	constructor(options: IApiClientOptions) {
		if (!options || !options.accessToken) {
			throw new ApiAiClientConfigurationError('Access token is required for new ApiAi.Client instance');
		}

		this.accessToken = options.accessToken;
		this.apiLang = options.lang || ApiAiConstants.DEFAULT_CLIENT_LANG;
		this.apiVersion = options.version || ApiAiConstants.DEFAULT_API_VERSION;
		this.apiBaseUrl = options.baseUrl || ApiAiConstants.DEFAULT_BASE_URL;
		this.sessionId = options.sessionId || this.guid();
		this.streamClientClass = options.streamClientClass || null;

		const headers = {
			Authorization: `Bearer ${this.accessToken}`,
		};

		this.query = new QueryRequestFactory(this.apiBaseUrl, this.apiVersion, { sessionId: this.sessionId, lang: this.apiLang }, headers);
		this.userEntities = new UserEntitiesRequestFactory(this.apiBaseUrl, this.apiVersion, this.sessionId, headers);
	}

	public createStreamClient(streamClientOptions: IStreamClientOptions = {}): IStreamClient {
		if (this.streamClientClass) {

			streamClientOptions.token = this.getAccessToken();
			streamClientOptions.sessionId =  this.getSessionId();
			streamClientOptions.lang = this.getApiLang();

			return new this.streamClientClass(streamClientOptions);
		} else {
			throw new ApiAiClientConfigurationError('No StreamClient implementation given to ApiAi Client constructor');
		}
	}

	public getAccessToken(): string {
		return this.accessToken;
	}

	public getApiVersion(): string {
		return (this.apiVersion) ? this.apiVersion : ApiAiConstants.DEFAULT_API_VERSION;
	}

	public getApiLang(): ApiAiConstants.AVAILABLE_LANGUAGES {
		return (this.apiLang) ? this.apiLang : ApiAiConstants.DEFAULT_CLIENT_LANG;
	}

	public getApiBaseUrl(): string {
		return (this.apiBaseUrl) ? this.apiBaseUrl : ApiAiConstants.DEFAULT_BASE_URL;
	}

	public setSessionId(sessionId: string) {
		this.sessionId = sessionId;
	}

	public getSessionId(): string {
		return this.sessionId;
	}

	/**
	 * generates new random UUID
	 * @returns {string}
	 */
	private guid(): string {
		const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			s4() + '-' + s4() + s4() + s4();
	}
}
