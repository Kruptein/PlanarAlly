export class AudioService {
    public audioPlayer: HTMLAudioElement;
    public audioSource: HTMLSourceElement;

    constructor() {
        this.audioPlayer = document.getElementById("clientAudioPlayer") as HTMLAudioElement;
        this.audioSource = document.getElementById("clientAudioSource") as HTMLSourceElement;
    }

    getAssetPath = (assetHash: string): string => {
        return `/static/assets/${assetHash}`;
      };

    startPlayback(file: string): void {
        this.audioSource.src = this.getAssetPath(file);
        this.audioPlayer.load();
        this.audioPlayer.play();
    }

    stopPlayback(): void {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
    }

    toggleLoopPlayback(): void {
        this.audioPlayer.loop = !this.audioPlayer.loop;
    }
}

export const audioService = new AudioService();
