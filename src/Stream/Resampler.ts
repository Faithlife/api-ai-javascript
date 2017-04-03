/**
 * this module is full copy-paste from v1 sdk. It should be like that while we send 'resempler' to worker as
 * 'function body'
 * @todo: re-make as normal class
 * @private
 */

export default function _resamplerJs(): void {

	function Resampler(fromSampleRate, toSampleRate, channels, outputBufferSize, noReturn) {
		this.fromSampleRate = fromSampleRate;
		this.toSampleRate = toSampleRate;
		this.channels = channels || 0;
		this.outputBufferSize = outputBufferSize;
		this.noReturn = !!noReturn;
		this.initialize();
	}

	Resampler.prototype.initialize = () => {
		// Perform some checks:
		if (this.fromSampleRate <= 0 || this.toSampleRate <= 0 || this.channels <= 0) {
			throw(new Error('Invalid settings specified for the resampler.'));
		}

		if (this.fromSampleRate === this.toSampleRate) {
			// Setup a resampler bypass:
			this.resampler = this.bypassResampler; // Resampler just returns what was passed through.
			this.ratioWeight = 1;
		} else {

			// Resampler is a custom quality interpolation algorithm.
			this.resampler = (buffer) => {
				const bufferLength = Math.min(buffer.length, this.outputBufferSize);

				if ((bufferLength % this.channels) !== 0) {
					throw(new Error('Buffer was of incorrect sample length.'));
				}

				if (bufferLength <= 0) {
					return (this.noReturn) ? 0 : [];
				}

				let weight = 0;
				const output = new Array(this.channels);
				for (let channel = 0; channel < this.channels; ++channel) {
					output[channel] = 0;
				}
				let actualPosition = 0;
				let amountToNext = 0;
				let alreadyProcessedTail = !this.tailExists;
				let outputOffset = 0;
				let currentPosition = 0;
				this.tailExists = false;
				const outputBuffer = this.outputBuffer;
				const ratioWeight = this.ratioWeight;
				do {
					if (alreadyProcessedTail) {
						weight = ratioWeight;
						for (let channel = 0; channel < this.channels; ++channel) {
							output[channel] = 0;
						}
					} else {
						weight = this.lastWeight;
						for (let channel = 0; channel < this.channels; ++channel) {
							output[channel] = this.lastOutput[channel];
						}
						alreadyProcessedTail = true;
					}

					while (weight > 0 && actualPosition < bufferLength) {
						amountToNext = 1 + actualPosition - currentPosition;
						if (weight >= amountToNext) {
							for (let channel = 0; channel < this.channels; ++channel) {
								output[channel] += buffer[actualPosition++] * amountToNext;
							}
							currentPosition = actualPosition;
							weight -= amountToNext;
						} else {
							for (let channel = 0; channel < this.channels; ++channel) {
								output[channel] += buffer[actualPosition + ((channel > 0) ? channel : 0)] * weight;
							}
							currentPosition += weight;
							weight = 0;
							break;
						}
					}

					if (weight === 0) {
						for (let channel = 0; channel < this.channels; ++channel) {
							outputBuffer[outputOffset++] = output[channel] / ratioWeight;
						}
					} else {
						this.lastWeight = weight;
						for (let channel = 0; channel < this.channels; ++channel) {
							this.lastOutput[channel] = output[channel];
						}
						this.tailExists = true;
						break;
					}
				} while (actualPosition < bufferLength);

				return this.bufferSlice(outputOffset);
			};
			this.ratioWeight = this.fromSampleRate / this.toSampleRate;
			this.tailExists = false;
			this.lastWeight = 0;
			this.initializeBuffers();
		}
	};

	Resampler.prototype.bypassResampler = (buffer) => {
		if (this.noReturn) {
			// Set the buffer passed as our own, as we don't need to resample it:
			this.outputBuffer = buffer;
			return buffer.length;
		} else {
			// Just return the buffer passsed:
			return buffer;
		}
	};

	Resampler.prototype.bufferSlice = (sliceAmount) => {
		if (this.noReturn) {
			// If we're going to access the properties directly from this object:
			return sliceAmount;
		} else {
			// Typed array and normal array buffer section referencing:
			try {
				return this.outputBuffer.subarray(0, sliceAmount);
			} catch (error) {
				try {
					// Regular array pass:
					this.outputBuffer.length = sliceAmount;
					return this.outputBuffer;
				} catch (error) {
					// Nightly Firefox 4 used to have the subarray function named as slice:
					return this.outputBuffer.slice(0, sliceAmount);
				}
			}
		}
	};

	Resampler.prototype.initializeBuffers = () => {
		// Initialize the internal buffer:
		try {
			this.outputBuffer = new Float32Array(this.outputBufferSize);
			this.lastOutput = new Float32Array(this.channels);
		} catch (error) {
			this.outputBuffer = [];
			this.lastOutput = [];
		}
	};

	navigator.Resampler = Resampler;
}
