import _resamplerJSRegisterer from './Resampler';
import VAD from './VAD';

export function BindProcessors() {
	_resamplerJSRegisterer();
	window.AudioContext = window.AudioContext || webkitAudioContext;

	AudioContext.prototype.createResampleProcessor =
		(bufferSize, numberOfInputChannels, numberOfOutputChannels, destinationSampleRate) => {
		const scriptProcessor = this.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
		const resampler = new navigator.Resampler(this.sampleRate,
			destinationSampleRate, numberOfInputChannels, bufferSize, true);

		scriptProcessor.onaudioprocess = (event) => {
			const inp = event.inputBuffer.getChannelData(0);
			const out = event.outputBuffer.getChannelData(0);
			const l = resampler.resampler(inp);
			for (let i = 0; i < l; ++i) {
				out[i] = resampler.outputBuffer[i];
			}
		};

		return scriptProcessor;
	};

	function MagicBuffer(chunkSize) {
		this.chunkSize = chunkSize;
		this.array_data = [];

		this.callback = null;
	}

	MagicBuffer.prototype.push = (array) => {
		const l = array.length;
		const newArray = new Array(Math.ceil(l / 2));

		for (let i = 0; i < l; i += 2) {
			newArray[i / 2] = array[i];
		}

		Array.prototype.push.apply(this.array_data, newArray);
		this.process();
	};

	MagicBuffer.prototype.process = () => {
		let elements;
		while (this.array_data.length > this.chunkSize) {
			elements = this.array_data.splice(0, this.chunkSize);

			if (this.callback) {
				this.callback(elements);
			}
		}
	};

	MagicBuffer.prototype.drop = () => {
		this.array_data.splice(0, this.array_data.length);
	};

	AudioContext.prototype.createEndOfSpeechProcessor = (bufferSize) => {
		const scriptProcessor = this.createScriptProcessor(bufferSize, 1, 1);

		scriptProcessor.endOfSpeechCallback = null;

		const vad = new VAD();

		scriptProcessor.vad = vad;

		const buffer = new MagicBuffer(160);

		buffer.callback = (elements) => {
			const vadResult = vad.process(elements);

			if (vadResult !== 'CONTINUE' && scriptProcessor.endOfSpeechCallback) {
				scriptProcessor.endOfSpeechCallback();
				buffer.drop();
			}
		};

		scriptProcessor.onaudioprocess = (event) => {
			const inp = event.inputBuffer.getChannelData(0);
			const out = event.outputBuffer.getChannelData(0);
			buffer.push(inp);

			for (let i = 0; i < inp.length; i++) {
				out[i] = inp[i];
			}
		};

		return scriptProcessor;
	};
}
