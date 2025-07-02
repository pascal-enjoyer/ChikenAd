import { _decorator, Component, Node, Vec3, tween, Animation, AudioClip, AudioSource } from 'cc';
const { ccclass, property } = _decorator;

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
    jumpAnimationName: string = 'jump';

    @property
    landAnimationName: string = 'land';

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

    private currentTargetPointIndex: number = 0;
    private animation: Animation | null = null;
    private audioSource: AudioSource | null = null;
    private isJumping: boolean = false;
    public hasJumped: boolean = false; // Флаг первого прыжка

    start() {
        this.animation = this.getComponent(Animation);
        this.audioSource = this.getComponent(AudioSource);

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

        if (this.animation && this.jumpAnimationName) {
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

        if (this.animation && this.landAnimationName) {
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
        if (this.finishScreenNode) this.finishScreenNode.active = true;
        if (this.finishScreenLand) this.finishScreenLand.active = true;
    }
}