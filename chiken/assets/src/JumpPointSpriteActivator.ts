import { _decorator, Component, Node, Label, tween, Vec3, AnimationComponent } from 'cc';
import { AnimatedRichTextNumber } from './AnimatedLabelNumber';
import { NumberSplitter } from './NumberSplitter';
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

    @property({ type: AnimatedRichTextNumber, tooltip: 'AnimatedRichTextNumber for land packshot money' })
    landPackshotMoney: AnimatedRichTextNumber | null = null;

    @property({ type: AnimatedRichTextNumber, tooltip: 'AnimatedRichTextNumber for port packshot money' })
    portPackshotMoney: AnimatedRichTextNumber | null = null;

    @property({ type: Label })
    landNotif: Label | null = null;

    @property({ type: Label })
    portNotif: Label | null = null;

    @property({ type: Label })
    landNotif2: Label | null = null;

    @property({ type: Label })
    portNotif2: Label | null = null;

    @property({ type: AnimationComponent, tooltip: 'Animation component for win animation' })
    winAnimation: AnimationComponent | null = null;

    @property({ type: AnimationComponent, tooltip: 'Animation component for winLand animation' })
    winLandAnimation: AnimationComponent | null = null;

    @property
    clipNumber: number = 0;

    @property({ type: NumberSplitter, tooltip: 'NumberSplitter for land notifications' })
    landNumberSplitter: NumberSplitter | null = null;

    @property({ type: NumberSplitter, tooltip: 'NumberSplitter for port notifications' })
    portNumberSplitter: NumberSplitter | null = null;

    @property
    targetValue: number = 100;

    @property
    startValue: number = 4.12;

    @property
    animationDuration: number = 0.5;

    @property
    dropTargetYOffset: number = -50;

    @property
    dropAnimationDuration: number = 0.3;

    @property
    soundDelay: number = 0.1;

    @property
    playActivationSound: boolean = false;

    @property({ type: Node, tooltip: 'Следующая точка прыжка' })
    nextJumpPoint: Node | null = null;

    private _initialDropNodeY: number = 0;
    private _isSpriteActive: boolean = false;
    private static hasReset: boolean = false;

    start() {
        if (!this.characterNode || !this.spriteContainerNode) {
            console.warn(`JumpPointSpriteActivator on ${this.node.name}: characterNode or spriteContainerNode not assigned`);
            this.enabled = false;
            return;
        }

        this.spriteContainerNode.active = false;
        this._isSpriteActive = false;

        // Для landNotif2 и portNotif2 используем сумму targetValue + startValue
        const totalValue = this.targetValue + this.startValue;
        // Для landNotif, portNotif используем targetValue
        if (this.landNotif) this.landNotif.string = `${this.targetValue.toFixed(2)} EUR`;
        if (this.landNotif2) this.landNotif2.string = `${totalValue.toFixed(2)} EUR`;
        if (this.portNotif) this.portNotif.string = `${this.targetValue.toFixed(2)} EUR`;
        if (this.portNotif2) this.portNotif2.string = `${totalValue.toFixed(2)} EUR`;

        // Pass targetValue to NumberSplitter components
        if (this.landNumberSplitter) {
            this.landNumberSplitter.setNumbers(this.targetValue);
        }
        if (this.portNumberSplitter) {
            this.portNumberSplitter.setNumbers(this.targetValue);
        }

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

        // Play animations if components exist
        if (this.winAnimation && this.winAnimation.clips[this.clipNumber]) {
            this.winAnimation.play(this.winAnimation.clips[this.clipNumber].name);
            this.winAnimation.pause();
        }
        if (this.winLandAnimation && this.winLandAnimation.clips[this.clipNumber]) {
            this.winLandAnimation.play(this.winLandAnimation.clips[this.clipNumber].name);
            this.winLandAnimation.pause();
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
}