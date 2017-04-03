import RecorderWorker from './RecorderWorker';
import Resampler from './Resampler';

export default class Recorder {
	private config;
	private context;
	private currCallback;
	private node;
	private recording;
	private worker;

	constructor(source, config: { bufferLen?, callback?, type? } = {}) {
		const bufferLen = config.bufferLen || 4096;
		this.context = source.context;
		this.config = config;
		this.node = this.context.createScriptProcessor(bufferLen, 1, 1);

		const worker = new Worker(this.getRecorderWorkerUrl());
		this.worker = worker;

		worker.postMessage({
			command: 'init',
			config: {
				sampleRate: this.context.sampleRate,
				resamplerInitializerBody: this.getFunctionBody(Resampler)
			}
		});

		this.node.onaudioprocess = (e) => {
			if (!this.recording) {
				return;
			}

			worker.postMessage({
				command: 'record',
				buffer: [
					e.inputBuffer.getChannelData(0)
				]
			});
		};

		worker.onmessage = (e) => {
			this.currCallback(e.data);
		};

		source.connect(this.node);
		this.node.connect(this.context.destination);
	}

	public configure(cfg) {
		for (const prop in cfg) {
			if (cfg.hasOwnProperty(prop)) {
				this.config[prop] = cfg[prop];
			}
		}
	}

	public record() {
		this.recording = true;
	}

	public stop() {
		this.recording = false;
	}

	public clear() {
		this.worker.postMessage({command: 'clear'});
	}

	public getBuffer(cb) {
		this.currCallback = cb || this.config.callback;
		this.worker.postMessage({command: 'getBuffer'});
	}

	public export16kMono(cb, type) {
		this.currCallback = cb || this.config.callback;
		type = type || this.config.type || 'audio/raw';
		if (!this.currCallback) {
			throw new Error('Callback not set');
		}

		this.worker.postMessage({
			command: 'export16kMono',
			type,
		});
	}

	private getRecorderWorkerUrl() {
		const getBlobUrl = window.URL && URL.createObjectURL.bind(URL);
		return getBlobUrl(new Blob(
			[ this.getFunctionBody(RecorderWorker.createRecorderWorker())],
			{ type: 'text/javascript' }
		));
	}

	private getFunctionBody(fn) {
		if (typeof fn !== 'function') {
			throw new Error('Illegal argument exception: argument is not a funtion: ' + fn);
		}

		const fnStr = fn.toString();
		const start = fnStr.indexOf('{');
		const fin = fnStr.lastIndexOf('}');

		return (start > 0 && fin > 0) ? fnStr.substring(start + 1, fin) : fnStr;
	}
}
