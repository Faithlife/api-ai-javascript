export default class RecorderWorker {
	public static createRecorderWorker() {
		return function _recorderWorkerJs() {

			let recLength = 0;
			let recBuffers = [];
			let sampleRate;
			let resampler;

			this.onmessage = (e) => {
				switch (e.data.command) {
					case 'init':
						init(e.data.config);
						break;
					case 'record':
						record(e.data.buffer);
						break;
					case 'export16kMono':
						export16kMono(e.data.type);
						break;
					case 'getBuffer':
						getBuffer();
						break;
					case 'clear':
						clear();
						break;
					default:
						break;
				}
			};

			function init(config) {
				// Invoke initializer to register Resampler within navigator object
				(new Function(config.resamplerInitializerBody))();

				sampleRate = config.sampleRate;
				// resampler = new Resampler(sampleRate, 16000, 1, 50 * 1024, false);
				resampler = new navigator.Resampler(sampleRate, 16000, 1, 50 * 1024, false);
			}

			function record(inputBuffer) {
				recBuffers.push(inputBuffer[0]);
				recLength += inputBuffer[0].length;
			}

			function export16kMono(type) {
				const buffer = mergeBuffers(recBuffers, recLength);
				const samples = resampler.resampler(buffer);
				const dataview = encodeRAW(samples);
				const audioBlob = new Blob([dataview], { type });

				this.postMessage(audioBlob);
			}

			function getBuffer() {
				const buffers = [];
				buffers.push(mergeBuffers(recBuffers, recLength));
				this.postMessage(buffers);
			}

			function clear() {
				recLength = 0;
				recBuffers = [];
			}

			function mergeBuffers(buffers, length) {
				const result = new Float32Array(length);
				let offset = 0;
				for (const buffer of buffers) {
					result.set(buffer, offset);
					offset += buffer.length;
				}
				return result;
			}

			function _floatTo16BitPCM(output, offset, input) {
				for (let i = 0; i < input.length; i++, offset += 2) {
					const s = Math.max(-1, Math.min(1, input[i]));
					output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
				}
			}

			function _writeString(view, offset, text) {
				for (let i = 0; i < text.length; i++) {
					view.setUint8(offset + i, text.charCodeAt(i));
				}
			}

			function encodeRAW(samples) {
				const buffer = new ArrayBuffer(samples.length * 2);
				const view = new DataView(buffer);
				_floatTo16BitPCM(view, 0, samples);
				return view;
			}
		};
	}
}
