import { ApiAiRequestError } from '../Errors';
import { ICancellationToken, IServerResponse, IStringMap } from '../Interfaces';
import XhrRequest from '../XhrRequest';

abstract class Request {

	private static handleSuccess(xhr: XMLHttpRequest): Promise<IServerResponse> {
		return Promise.resolve(JSON.parse(xhr.responseText));
	}

	private static handleError(xhr: XMLHttpRequest): Promise<ApiAiRequestError> {
		let error = new ApiAiRequestError(null);
		try {
			const serverResponse: IServerResponse = JSON.parse(xhr.responseText);
			if (serverResponse.status && serverResponse.status.errorDetails) {
				error = new ApiAiRequestError(serverResponse.status.errorDetails, serverResponse.status.code);
			} else {
				error = new ApiAiRequestError(xhr.statusText, xhr.status);
			}
		} catch (e) {
			error = new ApiAiRequestError(xhr.statusText, xhr.status);
		}

		return Promise.reject<ApiAiRequestError>(error);
	}

	protected constructor(
		private readonly uri: string,
		private readonly method: XhrRequest.Method,
		protected payload: any, protected headers: IStringMap,
		protected options: IStringMap = {}) {
	}

	public perform(token: ICancellationToken = null): Promise<IServerResponse> {
		const { uri, method, headers, payload, options } = this;
		return XhrRequest.ajax(method, uri, payload, headers, options, token)
			.then(Request.handleSuccess.bind(this))
			.catch(Request.handleError.bind(this));
	}
}

export default Request;
