import { _decorator, Component, Label, tween, CCInteger, Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AnimatedLabelNumber')
export class AnimatedLabelNumber extends Component {

    @property({ type: Label })
    private targetLabel: Label | null = null;

    @property(CCInteger)
    private initialValue: number = 0; // Целевое значение для начальной анимации (куда анимируем)

    @property
    private animationDuration: number = 0.5;

    @property
    private roundToInt: boolean = true;

    private _currentDisplayedValue: number = 0;
    private _activeTween: Tween<any> | null = null;

    onLoad() {
        if (!this.targetLabel) {
            this.targetLabel = this.getComponent(Label);
        }

        if (!this.targetLabel) {
            this.enabled = false;
            return;
        }
        
        // Устанавливаем начальное значение для отображения, чтобы избежать пустого лейбла
        // Это значение будет перезаписано в onEnable перед анимацией
        this._currentDisplayedValue = 0; 
        this.targetLabel.string = this.roundToInt ? 
            Math.floor(this._currentDisplayedValue).toString(): 
            this._currentDisplayedValue.toFixed(2);
    }

    onEnable() {
        // Убедимся, что анимация всегда начинается с 0
        this._currentDisplayedValue = 0; 
        this.targetLabel.string = this.roundToInt ? 
            Math.floor(this._currentDisplayedValue).toString(): 
            this._currentDisplayedValue.toFixed(2);

        // Запускаем анимацию от 0 до initialValue
        this.animateTo(this.initialValue, this.animationDuration);
    }

    public animateTo(targetValue: number, duration?: number) {
        if (!this.targetLabel) {
            return;
        }

        if (this._activeTween) {
            this._activeTween.stop();
        }

        let startValue = this._currentDisplayedValue; // Начальное значение для новой анимации (будет 0 благодаря onEnable)

        const animProxy = { value: startValue };

        this._activeTween = tween(animProxy)
            .to(duration !== undefined ? duration : this.animationDuration, { value: targetValue }, {
                onUpdate: (target: { value: number }) => {
                    if (this.targetLabel) {
                        this.targetLabel.string = this.roundToInt ?
                            Math.floor(target.value).toString():
                            target.value.toFixed(2);
                    }
                },
                onComplete: () => {
                    if (this.targetLabel) {
                        this.targetLabel.string = this.roundToInt ?
                            Math.floor(targetValue).toString():
                            targetValue.toFixed(2);
                    }
                    this._currentDisplayedValue = targetValue;
                    this._activeTween = null;
                }
            })
            .start();
    }

    public setValue(value: number) {
        if (!this.targetLabel) {
            return;
        }
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }
        this._currentDisplayedValue = value;
        this.targetLabel.string = this.roundToInt ? Math.floor(value).toString() : value.toFixed(2);
    }

    public getCurrentDisplayedValue(): number {
        return this._currentDisplayedValue;
    }
}