import { _decorator, Component, Node, Label, tween, Vec3, AudioClip, AudioSource } from 'cc';
import { AnimatedLabelNumber } from './AnimatedLabelNumber';
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

    @property({ type: AnimatedLabelNumber, tooltip: 'AnimatedLabelNumber for land packshot money' })
    landPackshotMoney: AnimatedLabelNumber | null = null;

    @property({ type: AnimatedLabelNumber, tooltip: 'AnimatedLabelNumber for port packshot money' })
    portPackshotMoney: AnimatedLabelNumber | null = null;

    @property({ type: Label})
    landNotif: Label | null = null;

    @property({ type: Label})
    portNotif: Label | null = null;

    @property({ type: Label})
    landNotif2: Label | null = null;

    @property({ type: Label})
    portNotif2: Label | null = null;

    @property
    targetValue: number = 100;

    @property
    startValue: number = 4.12;

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

    @property({ type: Node, tooltip: 'Следующая точка прыжка' })
    nextJumpPoint: Node | null = null;

    private _initialDropNodeY: number = 0;
    private _isSpriteActive: boolean = false;
    private audioSource: AudioSource | null = null;
    private static hasReset: boolean = false;

    start() {
        if (!this.characterNode || !this.spriteContainerNode) {
            console.warn(`JumpPointSpriteActivator on ${this.node.name}: characterNode or spriteContainerNode not assigned`);
            this.enabled = false;
            return;
        }

        if (this.spriteToDropNode) {
            this._initialDropNodeY = this.spriteToDropNode.position.y;
        }

        this.audioSource = this.getComponent(AudioSource);
        this.spriteContainerNode.active = false;
        this._isSpriteActive = false;
        
        // Для landNotif2 и portNotif2 используем сумму targetValue + startValue
        const totalValue = this.targetValue + this.startValue;
        // Для landNotif и portNotif оставляем targetValue
        this.landNotif.string = this.targetValue.toString();
        
        this.landNotif2.string = totalValue.toString();
        this.portNotif.string = this.targetValue.toString();
        
        this.portNotif2.string = totalValue.toString();

        if (!JumpPointSpriteActivator.hasReset) {
            if (this.displayLabel) {
                this.displayLabel.string = '0.00 €';
            }
            if (this.displayLabelLand) {
                this.displayLabelLand.string = '0.00 €';
            }
            JumpPointSpriteActivator.hasReset = true;
        }

        // Для packshotMoney устанавливаем сумму как initialValue, но начинаем с startValue
        if (this.landPackshotMoney) {
            this.landPackshotMoney.initialValue = totalValue;
            this.landPackshotMoney.setValue(this.startValue);
        }
        if (this.portPackshotMoney) {
            this.portPackshotMoney.initialValue = totalValue;
            this.portPackshotMoney.setValue(this.startValue);
        }
    }
    private formatNumber(value: number): string {
        return value.toFixed(2);
    }

    update() {
        if (!this.characterNode || !this.spriteContainerNode || !this.enabled) return;

        const currentPointX = this.node.worldPosition.x;
        const characterX = this.characterNode.worldPosition.x;
        const distanceX = Math.abs(currentPointX - characterX);

        if (distanceX <= this.activationDistanceX && !this._isSpriteActive) {
            if (this.landPackshotMoney) {
                this.landPackshotMoney.initialValue = this.targetValue + this.startValue;
            }
            if (this.portPackshotMoney) {
                this.portPackshotMoney.initialValue = this.targetValue + this.startValue;
            }

            this.spriteContainerNode.active = true;
            this._isSpriteActive = true;
            this.animateValue();
            this.animateSpriteDrop();
        }
    }

    private animateValue() {
        if (this.displayLabel) {
            tween(this.displayLabel).stop();
            let currentValue = parseFloat(this.displayLabel.string.replace(' €', '')) || 0;
            const animObject = { value: currentValue };
            tween(animObject)
                .to(this.animationDuration, { value: this.targetValue }, {
                    onUpdate: (target: { value: number }) => {
                        this.displayLabel!.string = `${this.formatNumber(target.value)} €`;
                    },
                    onComplete: () => {
                        this.displayLabel!.string = `${this.formatNumber(this.targetValue)} €`;
                    }
                })
                .start();
        }

        if (this.displayLabelLand) {
            tween(this.displayLabelLand).stop();
            let currentValueLand = parseFloat(this.displayLabelLand.string.replace(' €', '')) || 0;
            const animObjectLand = { value: currentValueLand };
            tween(animObjectLand)
                .to(this.animationDuration, { value: this.targetValue }, {
                    onUpdate: (target: { value: number }) => {
                        this.displayLabelLand!.string = `${this.formatNumber(target.value)} €`;
                    },
                    onComplete: () => {
                        this.displayLabelLand!.string = `${this.formatNumber(this.targetValue)} €`;
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
}