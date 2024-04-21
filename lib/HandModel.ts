import * as handdetection from '@tensorflow-models/hand-pose-detection';

export default class HandPetRecognizer {

	private past = {
		x: 0,
		y: 0,
		z: 0,
	};

	private startTime: number;
	private detector: handdetection.HandDetector | undefined; 
	
	constructor() {
		this.startTime = Date.now();
		this.setupHandDetector.bind(this)();
	}

	async setupHandDetector() {
		this.detector = await handdetection.createDetector(handdetection.SupportedModels.MediaPipeHands, {
			runtime: "mediapipe",
			modelType: "full",
			maxHands: 2
		});
	}

	async processImage(cameraData: Uint8Array): Promise<number> {
		let hands = null;

		// Detector can be null if initialization failed (for example when loading
		// from a URL that does not exist).
		if (this.detector) {
			// Detectors can throw errors, for example when using custom URLs that
			// contain a model that doesn't provide the expected output.
			try {
				hands = await this.detector.estimateHands(cameraData, { flipHorizontal: false });
			} catch (error) {
				this.detector.dispose();
				this.detector = undefined;
				throw (error);
			}
		}

		let intervalTimeInSeconds = 0.5;
		let threshold = 0.05;

		let vel = {
			x: 0,
			y: 0,
			z: 0
		};

		if (!hands) return 0;

		if (hands && hands.length > 0) {
			let point;
			if (hands[0].keypoints3D) {
				point = hands[0].keypoints3D[0];
			}
			if (!point) {
				return 0;
			}

			if ((Date.now() - this.startTime) / 1000 > intervalTimeInSeconds) {
				vel.x = Math.abs((point.x - this.past.x)) / intervalTimeInSeconds;
				vel.y = Math.abs((point.y - this.past.y)) / intervalTimeInSeconds;

				let velocity = Math.sqrt(vel.x ** 2 + vel.y ** 2);

				this.past.x = point.x;
				this.past.y = point.y;
				this.startTime = Date.now();
				if (velocity >= threshold) {
					return velocity;
				} else {
					return 0;
				}
			}
		}
		return 0;
	}

}
