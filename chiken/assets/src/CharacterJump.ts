import { _decorator, Component, Node, Vec3, tween, Animation, AudioClip, AudioSource, AnimationClip } from 'cc';
const { ccclass, property } = _decorator;

// Определяем имя события
export const LAST_JUMP_COMPLETED_EVENT = 'last-jump-completed';

@ccclass('CharacterJump')
export class CharacterJump extends Component {
    @property([Node])
    jumpPoints: Node[] = [];

    @property
    jumpHeight: number = 2;

    @property
    jumpDuration: number = 0.5;

    @property
    landingSinkAmount: number = 0.2;

    @property
    landingSinkDuration: number = 0.1;

    @property
    landingRiseDuration: number = 0.2;

    @property
    landOffsetHeight: number = 0.5;

    @property
    landDropDuration: number = 0.3;

    @property
    jumpAnimationName: string = 'Bird'; // Анимация для начала прыжка

    @property
    landAnimationName: string = 'land'; // Анимация для посадки (опционально)

    @property
    stopAnimationWhenIdle: boolean = true;

    @property(Node)
    finishScreenNode: Node | null = null;

    @property(Node)
    finishScreenLand: Node | null = null;

    @property
    finishScreenDelay: number = 1.0;

    @property(AudioClip)
    jumpSound: AudioClip | null = null;

    @property({ type: Node, tooltip: 'Узел, с которого брать компонент Animation' })
    animationNode: Node | null = null;

    private currentTargetPointIndex: number = 0;
    private animation: Animation | null = null;
    private audioSource: AudioSource | null = null;
    private isJumping: boolean = false;
    public hasJumped: boolean = false; // Флаг первого прыжка

    start() {
        // Получаем компонент Animation с указанного animationNode или текущего узла
        this.animation = this.animationNode ? this.animationNode.getComponent(Animation) : this.getComponent(Animation);
        this.audioSource = this.getComponent(AudioSource);

        if (this.animation) {
            // Проверяем, существует ли анимация Bird
            const clips = this.animation.clips;
            const birdClipExists = clips.some(clip => clip && clip.name === this.jumpAnimationName);
            if (!birdClipExists) {
                console.warn(`CharacterJump: Animation clip "${this.jumpAnimationName}" not found on node ${this.animationNode ? this.animationNode.name : this.node.name}`);
                this.animation = null; // Отключаем анимацию, если клип не найден
            }
            // Проверяем, существует ли анимация посадки (если используется)
            if (this.landAnimationName) {
                const landClipExists = clips.some(clip => clip && clip.name === this.landAnimationName);
                if (!landClipExists) {
                    console.warn(`CharacterJump: Landing animation clip "${this.landAnimationName}" not found on node ${this.animationNode ? this.animationNode.name : this.node.name}`);
                }
            }
        } else {
            console.warn(`CharacterJump: Animation component not found on node ${this.animationNode ? this.animationNode.name : this.node.name}`);
        }

        if (this.stopAnimationWhenIdle && this.animation) {
            this.animation.stop();
        }

        if (!this.audioSource) {
            console.warn('CharacterJump: AudioSource component not found.');
        }

        if (this.jumpPoints.length === 0) {
            console.warn('CharacterJump: No jump points defined.');
        }
    }

    jumpToNextPoint() {
        if (this.isJumping || this.jumpPoints.length === 0) return;

        this.isJumping = true;
        const targetNode = this.jumpPoints[this.currentTargetPointIndex];
        this.executeJump(targetNode.position, () => {
            const nextIndex = this.currentTargetPointIndex + 1;
            const isLast = nextIndex === this.jumpPoints.length;

            // Устанавливаем флаг после первого прыжка
            if (!this.hasJumped) {
                this.setHasJumped();
            }

            if (isLast) {
                // Отправляем событие последнего прыжка
                console.log('CharacterJump: Emitting LAST_JUMP_COMPLETED_EVENT');
                this.node.emit(LAST_JUMP_COMPLETED_EVENT);
                // Активируем финальный экран с задержкой
                this.scheduleOnce(this.activateFinishScreen, this.finishScreenDelay);
            } else {
                this.currentTargetPointIndex = nextIndex;
            }
        });
    }

    jumpToPoint(index: number) {
        if (this.isJumping || index < 0 || index >= this.jumpPoints.length) return;

        this.isJumping = true;
        const targetNode = this.jumpPoints[index];
        this.executeJump(targetNode.position, () => {
            this.currentTargetPointIndex = index;
            const isLast = index === this.jumpPoints.length - 1;

            // Устанавливаем флаг после первого прыжка
            if (!this.hasJumped) {
                this.setHasJumped();
            }

            if (isLast) {
                // Отправляем событие последнего прыжка
                console.log('CharacterJump: Emitting LAST_JUMP_COMPLETED_EVENT');
                this.node.emit(LAST_JUMP_COMPLETED_EVENT);
                // Активируем финальный экран с задержкой
                this.scheduleOnce(this.activateFinishScreen, this.finishScreenDelay);
            }
        });
    }

    // Метод для установки флага первого прыжка
    public setHasJumped() {
        this.hasJumped = true;
    }

    private executeJump(targetPos: Vec3, onComplete: () => void) {
        const startPos = this.node.position.clone();
        const initialLandPos = new Vec3(targetPos.x, targetPos.y + this.landOffsetHeight, targetPos.z);
        const midPos = new Vec3(
            (startPos.x + initialLandPos.x) / 2,
            Math.max(startPos.y, initialLandPos.y) + this.jumpHeight,
            (startPos.z + initialLandPos.z) / 2
        );

        // Воспроизводим анимацию Bird в начале прыжка
        if (this.animation && this.jumpAnimationName) {
            console.log(`CharacterJump: Playing animation "${this.jumpAnimationName}" at jump start`);
            this.animation.play(this.jumpAnimationName);
        }

        if (this.audioSource && this.jumpSound) {
            this.audioSource.playOneShot(this.jumpSound);
        }

        tween(this.node)
            .to(this.jumpDuration / 2, { position: midPos })
            .to(this.jumpDuration / 2, { position: initialLandPos })
            .call(() => {
                tween(this.node)
                    .to(this.landDropDuration, { position: targetPos })
                    .call(() => {
                        this.isJumping = false;
                        this.performLandingEffect();
                        onComplete();
                    })
                    .start();
            })
            .start();
    }

    private performLandingEffect() {
        const currentPos = this.node.position.clone();
        const sinkPos = new Vec3(currentPos.x, currentPos.y - this.landingSinkAmount, currentPos.z);

        // Воспроизводим анимацию посадки, если указана
        if (this.animation && this.landAnimationName) {
            console.log(`CharacterJump: Playing landing animation "${this.landAnimationName}"`);
            this.animation.play(this.landAnimationName);
        }

        tween(this.node)
            .to(this.landingSinkDuration, { position: sinkPos })
            .call(() => {
                if (this.stopAnimationWhenIdle && this.animation) {
                    this.animation.stop();
                }
            })
            .start();
    }

    private activateFinishScreen() {
        console.log('CharacterJump: Activating finish screen');
        if (this.finishScreenNode) this.finishScreenNode.active = true;
        if (this.finishScreenLand) this.finishScreenLand.active = true;
    }
}