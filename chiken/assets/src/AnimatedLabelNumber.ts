import { _decorator, Component, RichText, tween, CCInteger, CCFloat, Tween   } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnimatedRichTextNumber')
export class AnimatedRichTextNumber extends Component {
    @property({ type: RichText })
    private targetRichText: RichText | null = null;

    @property({ type: CCInteger, visible: true, serializable: true })
    private _initialValue: number = 0;

    @property
    private animationDuration: number = 0.5;

    @property
    private roundToInt: boolean = true;

    @property({ tooltip: 'Добавлять " EUR" после числа' })
    private addEurSuffix: boolean = true;

    @property({ type: CCFloat, tooltip: 'Размер шрифта дробной части (в пикселях)', visible: function(this: AnimatedRichTextNumber) { return !this.roundToInt; } })
    private decimalFontSize: number = 40;

    private _currentDisplayedValue: number = 0;
    private _activeTween: Tween<any> | null = null;

    private formatValue(value: number): string {
        if (this.roundToInt) {
            let formattedValue = Math.floor(value).toString();
            if (this.addEurSuffix) {
                formattedValue += ' EUR';
            }
            return formattedValue;
        } else {
            // Split the number into integer and decimal parts
            const [integerPart, decimalPart] = value.toFixed(2).split('.');
            // Format with rich text: integer part uses default size, decimal part, comma, and EUR use specified size
            let formattedValue = `${integerPart}<size=${this.decimalFontSize}>,<color=#000000>${decimalPart}${this.addEurSuffix ? ' EUR' : ''}</color></size>`;
            return formattedValue;
        }
    }

    onLoad() {
        if (!this.targetRichText) {
            this.targetRichText = this.getComponent(RichText);
        }

        if (!this.targetRichText) {
            console.warn(`AnimatedRichTextNumber on ${this.node.name}: No targetRichText found, disabling component`);
            this.enabled = false;
            return;
        }

        console.log(`AnimatedRichTextNumber on ${this.node.name}: onLoad, initialValue=${this.initialValue}`);
        this._currentDisplayedValue = 0;
        this.targetRichText.string = this.formatValue(this._currentDisplayedValue);
    }

    onEnable() {
        console.log(`AnimatedRichTextNumber on ${this.node.name}: onEnable, animating to initialValue=${this.initialValue}`);
        this._currentDisplayedValue = 0;
        this.targetRichText!.string = this.formatValue(this._currentDisplayedValue);

        this.animateTo(this.initialValue, this.animationDuration);
    }

    public animateTo(targetValue: number, duration?: number) {
        if (!this.targetRichText) {
            console.warn(`AnimatedRichTextNumber on ${this.node.name}: No targetRichText for animation`);
            return;
        }

        if (this._activeTween) {
            this._activeTween.stop();
        }

        let startValue = this._currentDisplayedValue;
        console.log(`AnimatedRichTextNumber on ${this.node.name}: Animating from ${startValue} to ${targetValue}`);

        const animProxy = { value: startValue };
        this._activeTween = tween(animProxy)
            .to(duration !== undefined ? duration : this.animationDuration, { value: targetValue }, {
                onUpdate: (target: { value: number }) => {
                    if (this.targetRichText) {
                        this.targetRichText.string = this.formatValue(target.value);
                    }
                },
                onComplete: () => {
                    if (this.targetRichText) {
                        this.targetRichText.string = this.formatValue(targetValue);
                    }
                    this._currentDisplayedValue = targetValue;
                    this._activeTween = null;
                    console.log(`AnimatedRichTextNumber on ${this.node.name}: Animation completed to ${targetValue}`);
                }
            })
            .start();
    }

    public setValue(value: number) {
        if (!this.targetRichText) {
            console.warn(`AnimatedRichTextNumber on ${this.node.name}: No targetRichText for setValue`);
            return;
        }
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }
        this._currentDisplayedValue = value;
        this.targetRichText.string = this.formatValue(value);
        console.log(`AnimatedRichTextNumber on ${this.node.name}: setValue called with ${value}`);
    }

    public set initialValue(value: number) {
        this._initialValue = value;
        console.log(`AnimatedRichTextNumber on ${this.node.name}: initialValue set to ${value}`);
    }

    public get initialValue(): number {
        return this._initialValue;
    }

    public getCurrentDisplayedValue(): number {
        return this._currentDisplayedValue;
    }
}