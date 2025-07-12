import { _decorator, Component, AudioSource, AudioClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioIntervalPlayer')
export class AudioIntervalPlayer extends Component {
    @property({ type: AudioSource, tooltip: 'AudioSource component for playing the sound' })
    private audioSource: AudioSource | null = null;

    @property({ type: AudioClip, tooltip: 'Audio clip to play' })
    private audioClip: AudioClip | null = null;

    @property({ tooltip: 'Interval between audio plays (in seconds)' })
    private playInterval: number = 5.0;

    @property({ tooltip: 'Start playing audio immediately on load' })
    private playOnStart: boolean = true;

    @property({ tooltip: 'Maximum number of times to play the audio (0 for unlimited)' })
    private maxPlayCount: number = 5;

    private _timeSinceLastPlay: number = 0;
    private _playCount: number = 0;

    onLoad() {
        // Get AudioSource component if not assigned
        if (!this.audioSource) {
            this.audioSource = this.getComponent(AudioSource);
        }

        // Check if AudioSource and AudioClip are properly set
        if (!this.audioSource) {
            console.warn(`AudioIntervalPlayer on ${this.node.name}: No AudioSource found, disabling component`);
            this.enabled = false;
            return;
        }

        if (!this.audioClip) {
            console.warn(`AudioIntervalPlayer on ${this.node.name}: No AudioClip assigned, disabling component`);
            this.enabled = false;
            return;
        }

        // Assign the audio clip to the AudioSource
        this.audioSource.clip = this.audioClip;

        // Play immediately if playOnStart is true and maxPlayCount allows
        if (this.playOnStart && (this.maxPlayCount === 0 || this._playCount < this.maxPlayCount)) {
            this.audioSource.play();
            this._playCount++;
            this._timeSinceLastPlay = 0;
            console.log(`AudioIntervalPlayer on ${this.node.name}: Played audio (count: ${this._playCount}/${this.maxPlayCount})`);
        }
    }

    update(deltaTime: number) {
        if (!this.audioSource || !this.audioClip) return;

        // Stop updating if max play count is reached
        if (this.maxPlayCount !== 0 && this._playCount >= this.maxPlayCount) {
            return;
        }

        // Increment timer
        this._timeSinceLastPlay += deltaTime;

        // Check if it's time to play the audio
        if (this._timeSinceLastPlay >= this.playInterval) {
            this.audioSource.play();
            this._playCount++;
            this._timeSinceLastPlay = 0;
            console.log(`AudioIntervalPlayer on ${this.node.name}: Played audio (count: ${this._playCount}/${this.maxPlayCount})`);

            // Disable updates if max play count is reached
            if (this.maxPlayCount !== 0 && this._playCount >= this.maxPlayCount) {
                console.log(`AudioIntervalPlayer on ${this.node.name}: Max play count reached, stopping further plays`);
            }
        }
    }
}