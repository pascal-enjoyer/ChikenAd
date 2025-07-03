// CameraFollow.ts
// Минимальная версия для 2D-проекта: камера двигается ТОЛЬКО по X.
// Ось Y и ось Z вообще не трогаются.

import { _decorator, Component, Node, Camera, Vec3, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraFollow')
export class CameraFollow extends Component {
    /* ─────────────── Публичные свойства ─────────────── */

    @property({ type: Node, tooltip: 'Узел-цель (например, персонаж)' })
    target: Node | null = null;

    @property({ type: Camera, tooltip: 'Камера. Если не указана, берётся с этого узла.' })
    gameCamera: Camera | null = null;

    @property({ tooltip: 'Смещение по X в портретной ориентации' })
    offsetPortraitX = 0;

    @property({ tooltip: 'Смещение по X в ландшафтной ориентации' })
    offsetLandscapeX = 0;

    @property({ tooltip: 'Плавное следование' })
    smoothFollow = true;

    @property({ slide: true, range: [1, 20, 1], tooltip: 'Скорость плавного следования' })
    followSpeed = 5;

    /* ─────────────── Приватные поля ─────────────── */

    private _currentOffsetX = 0;
    private _tempTargetPos = new Vec3();
    private _tempCamPos = new Vec3();
    private _initialY = 0;
    private _initialZ = 0;

    /* ─────────────── Жизненный цикл ─────────────── */

    start () {
        if (!this.target) { console.warn('CameraFollow: Target не назначен'); this.enabled = false; return; }
        if (!this.gameCamera) this.gameCamera = this.getComponent(Camera);

        // Сохраняем начальные Y и Z, чтобы никогда их не менять
        this.node.getWorldPosition(this._tempCamPos);
        this._initialY = this._tempCamPos.y;
        this._initialZ = this._tempCamPos.z;

        // Настраиваем офсет под текущую ориентацию
        const isPortrait = view.getVisibleSize().height >= view.getVisibleSize().width;
        this.applyOffsetForOrientation(isPortrait);

        // Ставим камеру сразу в нужную позицию
        this.updateCameraPosition(1);
    }

    /** Меняем активный офсет при смене ориентации */
    public applyOffsetForOrientation (isPortrait: boolean) {
        this._currentOffsetX = isPortrait ? this.offsetPortraitX : this.offsetLandscapeX;
    }

    lateUpdate (dt: number) {
        if (!this.target) return;
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
