import { _decorator, Component, Node, Vec3, tween, Animation, AudioClip, AudioSource } from 'cc';
import { JumpPointSpriteActivator } from './JumpPointSpriteActivator'; // Убедитесь, что путь правильный
const { ccclass, property } = _decorator;

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

    @property(AudioClip)
    victorySound: AudioClip | null = null;

    @property({ type: Node, tooltip: 'Узел, с которого брать компонент Animation' })
    animationNode: Node | null = null;

    private currentTargetPointIndex: number = 0;
    private animation: Animation | null = null;
    private audioSource: AudioSource | null = null;
    private isJumping: boolean = false;
    public hasJumped: boolean = false;

    private isTriggered: boolean = false;

    start() {
        this.animation = this.animationNode ? this.animationNode.getComponent(Animation) : this.getComponent(Animation);
        this.audioSource = this.getComponent(AudioSource);

        if (this.animation) {
            const clips = this.animation.clips;
            const birdClipExists = clips.some(clip => clip && clip.name === this.jumpAnimationName);
            if (!birdClipExists) {
                console.warn(`CharacterJump: Animation clip "${this.jumpAnimationName}" not found on node ${this.animationNode ? this.animationNode.name : this.node.name}`);
                this.animation = null;
            }
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

        // Отключаем все JumpPointSpriteActivator при старте
        this.jumpPoints.forEach(point => {
            const activator = point.getComponent(JumpPointSpriteActivator);
            if (activator) {
                activator.enabled = false;
                console.log(`CharacterJump: Disabled JumpPointSpriteActivator on ${point.name} at start`);
            }
        });
    }

    jumpToNextPoint() {
        if (this.isJumping || this.jumpPoints.length === 0) return;

        this.isJumping = true;
        const targetNode = this.jumpPoints[this.currentTargetPointIndex];

        // Включаем JumpPointSpriteActivator целевой точки перед прыжком
        const targetActivator = targetNode.getComponent(JumpPointSpriteActivator);
        if (targetActivator) {
            console.log(`CharacterJump: Enabling JumpPointSpriteActivator on ${targetNode.name}`);
            targetActivator.enabled = true;
        } else {
            console.warn(`CharacterJump: No JumpPointSpriteActivator found on ${targetNode.name}`);
        }

        this.executeJump(targetNode.position, () => {
            const nextIndex = this.currentTargetPointIndex + 1;
            const isLast = nextIndex === this.jumpPoints.length;

            if (!this.hasJumped) {
                this.setHasJumped();
            }

            if (isLast) {
                console.log('CharacterJump: Emitting LAST_JUMP_COMPLETED_EVENT');
                this.node.emit(LAST_JUMP_COMPLETED_EVENT);
                // Проверяем, не активен ли уже экран победы
                if (!(this.finishScreenNode?.active || this.finishScreenLand?.active)) {
                    console.log('CharacterJump: Activating finish screen');
                    if (this.audioSource && this.victorySound) {
                        this.audioSource.playOneShot(this.victorySound);
                    }
                    this.scheduleOnce(() => {
                        if (this.finishScreenNode) {
                            this.finishScreenNode.active = true;
                        }
                        if (this.finishScreenLand) {
                            this.finishScreenLand.active = true;
                        }
                    }, this.finishScreenDelay);
                } else {
                    console.log('CharacterJump: Finish screen already active, skipping activation and sound');
                }
            } else {
                this.currentTargetPointIndex = nextIndex;
            }
            this.isJumping = false;
        });
    }

    jumpToPoint(index: number) {
        if (this.isJumping || index < 0 || index >= this.jumpPoints.length) return;

        this.isJumping = true;
        const targetNode = this.jumpPoints[index];

        // Включаем JumpPointSpriteActivator целевой точки перед прыжком
        const targetActivator = targetNode.getComponent(JumpPointSpriteActivator);
        if (targetActivator) {
            console.log(`CharacterJump: Enabling JumpPointSpriteActivator on ${targetNode.name}`);
            targetActivator.enabled = true;
        } else {
            console.warn(`CharacterJump: No JumpPointSpriteActivator found on ${targetNode.name}`);
        }

        this.executeJump(targetNode.position, () => {
            this.currentTargetPointIndex = index;
            const isLast = index === this.jumpPoints.length - 1;

            if (!this.hasJumped) {
                this.setHasJumped();
            }

            if (isLast) {
                console.log('CharacterJump: Emitting LAST_JUMP_COMPLETED_EVENT');
                this.node.emit(LAST_JUMP_COMPLETED_EVENT);
                
                // Проверяем, не активен ли уже экран победы
                this.triggerVictoryScreen();
            }
            this.isJumping = false;
        });
    }

    public setHasJumped() {
        this.hasJumped = true;
    }

public triggerVictoryScreen() {
    if (!this.hasJumped) {
        console.warn('CharacterJump: Cannot trigger victory screen, no jumps performed yet.');
        return;
    }
    
    // Проверяем, не был ли уже вызван экран победы
    if (this.isTriggered) {
        console.log('CharacterJump: Victory screen already triggered, skipping');
        return;
    }
    
    console.log('CharacterJump: Triggering victory screen manually');
    
    // Проверяем, не активен ли уже экран победы
    if (!(this.finishScreenNode?.active || this.finishScreenLand?.active)) {
        console.log('CharacterJump: Activating finish screen');
        this.isTriggered = true; // Устанавливаем флаг перед активацией
        
        if (this.audioSource && this.victorySound) {
            this.audioSource.playOneShot(this.victorySound);
        }
        
        this.scheduleOnce(() => {
            if (this.finishScreenNode) {
                this.finishScreenNode.active = true;
            }
            if (this.finishScreenLand) {
                this.finishScreenLand.active = true;
            }
        }, this.finishScreenDelay);
    } else {
        console.log('CharacterJump: Finish screen already active, skipping activation and sound');
    }
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
        // Метод оставлен для обратной совместимости, но не используется
        console.log('CharacterJump: activateFinishScreen called (deprecated)');
    }
}