import { _decorator, Component, RichText, tween, CCInteger, CCFloat, Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnimatedRichTextNumber')
export class AnimatedRichTextNumber extends Component {
    @property({ type: RichText })
    private integerRichText: RichText | null = null; // Для целой части

    @property({ type: RichText })
    private decimalRichText: RichText | null = null; // Для дробной части и суффикса EUR

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

    private formatIntegerPart(value: number): string {
        return Math.floor(value).toString();
    }

    private formatDecimalPart(value: number): string {
        if (this.roundToInt) {
            return this.addEurSuffix ? ' EUR' : '';
        } else {
            const [, decimalPart] = value.toFixed(2).split('.');
            return `<size=${this.decimalFontSize}>,${decimalPart}${this.addEurSuffix ? ' EUR' : ''}</size>`;
        }
    }

    onLoad() {
        if (!this.integerRichText || !this.decimalRichText) {
            console.warn(`AnimatedRichTextNumber on ${this.node.name}: Missing integerRichText or decimalRichText, disabling component`);
            this.enabled = false;
            return;
        }

        console.log(`AnimatedRichTextNumber on ${this.node.name}: onLoad, initialValue=${this._initialValue}`);
        this._currentDisplayedValue = 0;
        this.integerRichText.string = this.formatIntegerPart(this._currentDisplayedValue);
        this.decimalRichText.string = this.formatDecimalPart(this._currentDisplayedValue);
    }

    onEnable() {
        console.log(`AnimatedRichTextNumber on ${this.node.name}: onEnable, animating to initialValue=${this._initialValue}`);
        this._currentDisplayedValue = 0;
        if (this.integerRichText && this.decimalRichText) {
            this.integerRichText.string = this.formatIntegerPart(this._currentDisplayedValue);
            this.decimalRichText.string = this.formatDecimalPart(this._currentDisplayedValue);
        }

        this.animateTo(this._initialValue, this.animationDuration);
    }

    public animateTo(targetValue: number, duration?: number) {
        if (!this.integerRichText || !this.decimalRichText) {
            console.warn(`AnimatedRichTextNumber on ${this.node.name}: Missing integerRichText or decimalRichText for animation`);
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
                    if (this.integerRichText && this.decimalRichText) {
                        this.integerRichText.string = this.formatIntegerPart(target.value);
                        this.decimalRichText.string = this.formatDecimalPart(target.value);
                    }
                },
                onComplete: () => {
                    if (this.integerRichText && this.decimalRichText) {
                        this.integerRichText.string = this.formatIntegerPart(targetValue);
                        this.decimalRichText.string = this.formatDecimalPart(targetValue);
                    }
                    this._currentDisplayedValue = targetValue;
                    this._activeTween = null;
                    console.log(`AnimatedRichTextNumber on ${this.node.name}: Animation completed to ${targetValue}`);
                }
            })
            .start();
    }

    public setValue(value: number) {
        if (!this.integerRichText || !this.decimalRichText) {
            console.warn(`AnimatedRichTextNumber on ${this.node.name}: Missing integerRichText or decimalRichText for setValue`);
            return;
        }
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }
        this._currentDisplayedValue = value;
        this.integerRichText.string = this.formatIntegerPart(value);
        this.decimalRichText.string = this.formatDecimalPart(value);
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