import { _decorator, Component, Label, tween, CCInteger, Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnimatedLabelNumber')
export class AnimatedLabelNumber extends Component {
    @property({ type: Label })
    private targetLabel: Label | null = null;

    @property({ type: CCInteger, visible: true, serializable: true })
    private _initialValue: number = 0; // Свойство для инспектора

    @property
    private animationDuration: number = 0.5;

    @property
    private roundToInt: boolean = true;

    @property({ tooltip: 'Добавлять " EUR" после числа' })
    private addEurSuffix: boolean = true;

    private _currentDisplayedValue: number = 0;
    private _activeTween: Tween<any> | null = null;

    private formatValue(value: number): string {
        let formattedValue = this.roundToInt
            ? Math.floor(value).toString()
            : value.toFixed(2);
        
        if (this.addEurSuffix) {
            formattedValue += ' EUR';
        }
        
        return formattedValue;
    }

    onLoad() {
        if (!this.targetLabel) {
            this.targetLabel = this.getComponent(Label);
        }

        if (!this.targetLabel) {
            console.warn(`AnimatedLabelNumber on ${this.node.name}: No targetLabel found, disabling component`);
            this.enabled = false;
            return;
        }

        console.log(`AnimatedLabelNumber on ${this.node.name}: onLoad, initialValue=${this.initialValue}`);
        this._currentDisplayedValue = 0;
        this.targetLabel.string = this.formatValue(this._currentDisplayedValue);
    }

    onEnable() {
        console.log(`AnimatedLabelNumber on ${this.node.name}: onEnable, animating to initialValue=${this.initialValue}`);
        this._currentDisplayedValue = 0;
        this.targetLabel!.string = this.formatValue(this._currentDisplayedValue);

        this.animateTo(this.initialValue, this.animationDuration);
    }

    public animateTo(targetValue: number, duration?: number) {
        if (!this.targetLabel) {
            console.warn(`AnimatedLabelNumber on ${this.node.name}: No targetLabel for animation`);
            return;
        }

        if (this._activeTween) {
            this._activeTween.stop();
        }

        let startValue = this._currentDisplayedValue;
        console.log(`AnimatedLabelNumber on ${this.node.name}: Animating from ${startValue} to ${targetValue}`);

        const animProxy = { value: startValue };
        this._activeTween = tween(animProxy)
            .to(duration !== undefined ? duration : this.animationDuration, { value: targetValue }, {
                onUpdate: (target: { value: number }) => {
                    if (this.targetLabel) {
                        this.targetLabel.string = this.formatValue(target.value);
                    }
                },
                onComplete: () => {
                    if (this.targetLabel) {
                        this.targetLabel.string = this.formatValue(targetValue);
                    }
                    this._currentDisplayedValue = targetValue;
                    this._activeTween = null;
                    console.log(`AnimatedLabelNumber on ${this.node.name}: Animation completed to ${targetValue}`);
                }
            })
            .start();
    }

    public setValue(value: number) {
        if (!this.targetLabel) {
            console.warn(`AnimatedLabelNumber on ${this.node.name}: No targetLabel for setValue`);
            return;
        }
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }
        this._currentDisplayedValue = value;
        this.targetLabel.string = this.formatValue(value);
        console.log(`AnimatedLabelNumber on ${this.node.name}: setValue called with ${value}`);
    }

    // Геттер и сеттер для совместимости с JumpPointSpriteActivator
    public set initialValue(value: number) {
        this._initialValue = value;
        console.log(`AnimatedLabelNumber on ${this.node.name}: initialValue set to ${value}`);
    }

    public get initialValue(): number {
        return this._initialValue;
    }

    public getCurrentDisplayedValue(): number {
        return this._currentDisplayedValue;
    }
}