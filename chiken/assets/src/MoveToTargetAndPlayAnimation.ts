import { _decorator, Component, Node, Animation, AnimationClip } from 'cc';
import { CharacterJump } from './CharacterJump';
const { ccclass, property } = _decorator;

@ccclass('MoveToTargetAndPlayAnimation')
export class MoveToTargetAndPlayAnimation extends Component {
    @property({ type: String, tooltip: 'Имя анимации для воспроизведения по кругу до первого прыжка' })
    animationName: string = '';

    @property({ type: Node, tooltip: 'Узел с компонентом CharacterJump для отслеживания первого прыжка' })
    characterJumpNode: Node | null = null;

    private _animation: Animation | null = null;
    private _characterJump: CharacterJump | null = null;

    onEnable() {
        console.log('MoveToTargetAndPlayAnimation: onEnable called');
        // Получаем компонент Animation с текущего узла
        this._animation = this.getComponent(Animation);

        if (!this._animation) {
            console.warn('MoveToTargetAndPlayAnimation: Animation component not found');
            this.enabled = false;
            return;
        }

        if (!this.animationName) {
            console.warn('MoveToTargetAndPlayAnimation: Animation name is not assigned');
            this.enabled = false;
            return;
        }

        if (!this.characterJumpNode) {
            console.warn('MoveToTargetAndPlayAnimation: CharacterJump node is not assigned');
            this.enabled = false;
            return;
        }

        // Проверяем, существует ли анимационный клип
        const clips = this._animation.clips;
        const clipExists = clips.some(clip => clip && clip.name === this.animationName);
        if (!clipExists) {
            console.warn(`MoveToTargetAndPlayAnimation: Animation clip "${this.animationName}" not found`);
            this.enabled = false;
            return;
        }

        // Получаем компонент CharacterJump
        this._characterJump = this.characterJumpNode.getComponent(CharacterJump);
        if (!this._characterJump) {
            console.warn('MoveToTargetAndPlayAnimation: CharacterJump component not found on specified node');
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

    onDisable() {
        // Останавливаем анимацию при отключении компонента
        if (this._animation && this.animationName) {
            console.log('MoveToTargetAndPlayAnimation: Stopping animation on disable');
            this._animation.stop();
        }
    }

    update() {
        // Проверяем, произошёл ли первый прыжок
        if (this._characterJump && this._characterJump.hasJumped && this._animation) {
            console.log('MoveToTargetAndPlayAnimation: First jump detected, stopping animation');
            this._animation.stop();
            this.enabled = false; // Отключаем компонент после остановки анимации
        }
    }
}