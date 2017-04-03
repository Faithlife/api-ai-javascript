export default class VAD {

	private minCZ: number;
	private maxCZ: number;
	private frameLengthMilis: number;
	private maxSilenceLengthMilis;
	private minSilenceLengthMilis;
	private silenceLengthMilis;
	private sequenceLengthMilis;
	private minSequenceCount;
	private energyFactor;
	private noiseFrames;
	private noiseEnergy;
	private frameNumber;
	private lastActiveTime;
	private lastSequenceTime;
	private sequenceCounter;
	private time;

	constructor() {
		this.reset();
	}

	public process(frame) {
		const active = this.frameActive(frame);
		this.time = this.frameNumber * 160.0 / 16000.0;

		if (active) {
			if (this.lastActiveTime >= 0 && (this.time - this.lastActiveTime) < this.silenceLengthMilis) {
				this.sequenceCounter++;
				if (this.sequenceCounter >= this.minSequenceCount) {
					this.lastSequenceTime = this.time;
					const silenceDifference = (this.maxSilenceLengthMilis - this.minSilenceLengthMilis) / 4.0;
					const normalizedSilenceLength = this.silenceLengthMilis - silenceDifference;
					this.silenceLengthMilis = Math.max(this.minSilenceLengthMilis, normalizedSilenceLength);
				}
			} else {
				this.sequenceCounter = 1;
			}

			this.lastSequenceTime = this.time;
		} else {
			if (this.time - this.lastSequenceTime > this.silenceLengthMilis) {
				if (this.lastSequenceTime > 0) {
					return 'TERMINATE';
				} else {
					return 'NO_SPEECH';
				}
			}
		}

		return 'CONTINUE';
	}

	private frameActive(frame) {
		let energy = 0;
		let czCount = 0;

		let lastsign = 0;
		const frameLength = frame.length;

		for (let i = 0; i < frameLength; i++) {
			energy += (frame[i] * frame[i]) / 160.0;

			const sign = frame[i] > 0 ? 1 : -1;
			if (lastsign !== 0 && sign !== lastsign) {
				czCount++;
			}

			lastsign = sign;
		}

		this.frameNumber += 1;

		let result = false;

		if (this.frameNumber < this.noiseFrames) {
			this.noiseEnergy += energy / this.noiseFrames;
			console.log('noiseEnergy=', this.noiseEnergy);
		} else {
			if (czCount >= this.minCZ && czCount <= this.maxCZ) {
				if (energy > /*this.noiseEnergy*/ Math.max(0.01, this.noiseEnergy) * this.energyFactor) {
					result = true;
				}
			}
		}

		return result;
	}

	private reset() {
		this.minCZ = 5;
		this.maxCZ = 15;

		this.frameLengthMilis = 10.0;
		this.maxSilenceLengthMilis = 3.5;
		this.minSilenceLengthMilis = 0.8;
		this.silenceLengthMilis = this.maxSilenceLengthMilis;
		this.sequenceLengthMilis = 0.03;
		this.minSequenceCount = 3;
		this.energyFactor = 3.1;

		this.noiseFrames = Math.round(150. / this.frameLengthMilis);
		this.noiseEnergy = 0.0;
		this.frameNumber = 0;
		this.lastActiveTime = -1.0;
		this.lastSequenceTime = 0.0;
		this.sequenceCounter = 0;
		this.time = 0.0;
	}
}
