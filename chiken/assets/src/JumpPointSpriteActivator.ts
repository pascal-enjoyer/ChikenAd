import { _decorator, Component, Node, Label, tween, Vec3, AudioClip, AudioSource } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('JumpPointSpriteActivator')
export class JumpPointSpriteActivator extends Component {
    @property(Node)
    characterNode: Node | null = null;

    @property
    activationDistanceX: number = 300;

    @property(Node)
    spriteContainerNode: Node | null = null;

    @property(Label)
    displayLabel: Label | null = null;

    @property(Label)
    displayLabelLand: Label | null = null;

    @property
    targetValue: number = 100;

    @property
    animationDuration: number = 0.5;

    @property(Node)
    spriteToDropNode: Node | null = null;

    @property
    dropTargetYOffset: number = -50;

    @property
    dropAnimationDuration: number = 0.3;

    @property(AudioClip)
    activationSound: AudioClip | null = null;

    @property
    soundDelay: number = 0.1;

    @property
    playActivationSound: boolean = false;

    private _initialDropNodeY: number = 0;
    private _isSpriteActive: boolean = false;
    private audioSource: AudioSource | null = null;

    start() {
        if (!this.characterNode || !this.spriteContainerNode) {
            this.enabled = false;
            return;
        }

        if (this.spriteToDropNode) {
            this._initialDropNodeY = this.spriteToDropNode.position.y;
        }

        this.audioSource = this.getComponent(AudioSource);
        this.spriteContainerNode.active = false;
        this._isSpriteActive = false;

        if (this.displayLabel) {
            this.displayLabel.string = '0 €';
        }
        if (this.displayLabelLand) {
            this.displayLabelLand.string = '0 €';
        }
    }

    update() {
        if (!this.characterNode || !this.spriteContainerNode || !this.enabled) return;

        const currentPointX = this.node.worldPosition.x;
        const characterX = this.characterNode.worldPosition.x;
        const distanceX = Math.abs(currentPointX - characterX);

        if (distanceX <= this.activationDistanceX && !this._isSpriteActive) {
            this.spriteContainerNode.active = true;
            this._isSpriteActive = true;
            this.animateValue();
            this.animateSpriteDrop();
            this.playActivationSoundWithDelay();
        }
    }

    private animateValue() {
        if (this.displayLabel) {
            tween(this.displayLabel).stop();
        }
        if (this.displayLabelLand) {
            tween(this.displayLabelLand).stop();
        }

        if (this.displayLabel) {
            let currentValue = parseFloat(this.displayLabel.string) || 0;
            const animObject = { value: currentValue };
            tween(animObject)
                .to(this.animationDuration, { value: this.targetValue }, {
                    onUpdate: (target: { value: number }) => {
                        this.displayLabel!.string = `${Math.floor(target.value)} €`;
                    },
                    onComplete: () => {
                        this.displayLabel!.string = `${this.targetValue} €`;
                    }
                })
                .start();
        }

        if (this.displayLabelLand) {
            let currentValueLand = parseFloat(this.displayLabelLand.string) || 0;
            const animObjectLand = { value: currentValueLand };
            tween(animObjectLand)
                .to(this.animationDuration, { value: this.targetValue }, {
                    onUpdate: (target: { value: number }) => {
                        this.displayLabelLand!.string = `${Math.floor(target.value)} €`;
                    },
                    onComplete: () => {
                        this.displayLabelLand!.string = `${this.targetValue} €`;
                    }
                })
                .start();
        }
    }

    private animateSpriteDrop() {
        if (!this.spriteToDropNode) return;

        tween(this.spriteToDropNode).stop();

        const currentPos = this.spriteToDropNode.position.clone();
        const targetPos = new Vec3(currentPos.x, this._initialDropNodeY + this.dropTargetYOffset, currentPos.z);

        tween(this.spriteToDropNode)
            .to(this.dropAnimationDuration, { position: targetPos })
            .start();
    }

    private playActivationSoundWithDelay() {
        if (this.playActivationSound && this.audioSource && this.activationSound) {
            this.scheduleOnce(() => {
                this.audioSource!.playOneShot(this.activationSound!);
            }, this.soundDelay);
        }
    }
}
