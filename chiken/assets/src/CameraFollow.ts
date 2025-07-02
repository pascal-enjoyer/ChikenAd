import { _decorator, Component, Node, Camera, Vec3, view, tween } from 'cc';
import { CharacterJump } from './CharacterJump';
const { ccclass, property } = _decorator;

@ccclass('CameraFollow')
export class CameraFollow extends Component {
    /* ─────────────── Публичные свойства ─────────────── */

    @property({ type: Node, tooltip: 'Узел-цель (например, персонаж)' })
    target: Node | null = null;

    @property({ type: Camera, tooltip: 'Камера. Если не указана, берётся с этого узла.' })
    gameCamera: Camera | null = null;

    @property({ type: CharacterJump, tooltip: 'Компонент CharacterJump' })
    characterJump: CharacterJump | null = null;

    @property({ tooltip: 'Смещение по X в портретной ориентации' })
    offsetPortraitX = 0;

    @property({ tooltip: 'Смещение по X в ландшафтной ориентации' })
    offsetLandscapeX = 0;

    @property({ tooltip: 'Плавное следование' })
    smoothFollow = true;

    @property({ slide: true, range: [1, 20, 1], tooltip: 'Скорость плавного следования' })
    followSpeed = 5;

    @property({ tooltip: 'Длительность перехода оффсета в портретном режиме' })
    offsetTransitionDuration = 0.5;

    /* ─────────────── Приватные поля ─────────────── */

    private _currentOffsetX = 0;
    private _tempTargetPos = new Vec3();
    private _tempCamPos = new Vec3();
    private _initialY = 0;
    private _initialZ = 0;
    private _hasOffsetTransitioned = false; // Флаг для отслеживания перехода оффсета

    /* ─────────────── Жизненный цикл ─────────────── */

    start () {
        if (!this.target) { console.warn('CameraFollow: Target не назначен'); this.enabled = false; return; }
        if (!this.gameCamera) this.gameCamera = this.getComponent(Camera);
        if (!this.characterJump) this.characterJump = this.target.getComponent(CharacterJump);

        // Сохраняем начальные Y и Z, чтобы никогда их не менять
        this.node.getWorldPosition(this._tempCamPos);
        this._initialY = this._tempCamPos.y;
        this._initialZ = this._tempCamPos.z;

        // Настраиваем оффсет под текущую ориентацию
        const isPortrait = view.getVisibleSize().height >= view.getVisibleSize().width;
        this.applyOffsetForOrientation(isPortrait);

        // Ставим камеру сразу в нужную позицию
        this.updateCameraPosition(1);
    }

    /** Меняем активный оффсет при смене ориентации */
    public applyOffsetForOrientation (isPortrait: boolean) {
        if (isPortrait && this.characterJump && this.characterJump.hasJumped && !this._hasOffsetTransitioned) {
            // Создаём временный объект для анимации оффсета
            const offsetObj = { value: this._currentOffsetX };
            tween(offsetObj)
                .to(this.offsetTransitionDuration, { value: 0 }, { 
                    easing: 'sineOut',
                    onUpdate: (target: any) => {
                        this._currentOffsetX = target.value; // Обновляем _currentOffsetX на каждом кадре твина
                    }
                })
                .call(() => {
                    this._hasOffsetTransitioned = true; // Отмечаем, что переход выполнен
                })
                .start();
        } else if (!isPortrait || (isPortrait && (!this.characterJump || !this.characterJump.hasJumped))) {
            // Используем начальный оффсет для портретного или ландшафтного режима
            this._currentOffsetX = isPortrait ? this.offsetPortraitX : this.offsetLandscapeX;
            this._hasOffsetTransitioned = false; // Сбрасываем флаг при смене ориентации или до прыжка
        }
    }

    lateUpdate (dt: number) {
        if (!this.target) return;
        // Проверяем ориентацию каждый кадр, чтобы обновить оффсет при смене
        const isPortrait = view.getVisibleSize().height >= view.getVisibleSize().width;
        this.applyOffsetForOrientation(isPortrait);
        this.updateCameraPosition(dt);
    }

    /* ─────────────── Логика движения ─────────────── */

    private updateCameraPosition (dt: number) {
        // 1. Текущая мировая позиция цели
        this.target!.getWorldPosition(this._tempTargetPos);

        // 2. Рассчитываем желаемый X
        const desiredX = this._tempTargetPos.x + this._currentOffsetX;

        // 3. Берём текущую позицию камеры
        this.node.getWorldPosition(this._tempCamPos);

        // 4. Обновляем только X
        if (this.smoothFollow) {
            this._tempCamPos.x = this._tempCamPos.x + (desiredX - this._tempCamPos.x) * Math.min(1, dt * this.followSpeed);
        } else {
            this._tempCamPos.x = desiredX;
        }

        // 5. Сохраняем фиксированные Y и Z
        this._tempCamPos.y = this._initialY;
        this._tempCamPos.z = this._initialZ;

        // 6. Применяем позицию
        this.node.setWorldPosition(this._tempCamPos);
    }
}