import { _decorator, Component, Animation, AnimationClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoopAnimation')
export class LoopAnimation extends Component {
    @property({ type: String, tooltip: 'Имя анимации для воспроизведения по кругу до первого прыжка' })
    animationName: string = '';
    private _animation: Animation | null = null;

    onEnable() {
        this._animation = this.getComponent(Animation);
                // Проверяем, существует ли анимационный клип
        const clips = this._animation.clips;
        const clipExists = clips.some(clip => clip && clip.name === this.animationName);
        if (!clipExists) {
            console.warn(`MoveToTargetAndPlayAnimation: Animation clip "${this.animationName}" not found`);
            this.enabled = false;
            return;
        }
        // Устанавливаем анимацию в режим цикла
        const clip = this._animation.clips.find(c => c && c.name === this.animationName);
        if (clip) {
            const state = this._animation.createState(clip, this.animationName);
            state.wrapMode = AnimationClip.WrapMode.Loop;
            console.log(`MoveToTargetAndPlayAnimation: Animation "${this.animationName}" set to loop`);
        }

        // Запускаем анимацию
        console.log(`MoveToTargetAndPlayAnimation: Playing animation "${this.animationName}"`);
        this._animation.play(this.animationName);
    }

}