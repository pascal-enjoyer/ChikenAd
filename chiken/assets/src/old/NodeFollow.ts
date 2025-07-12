// NodeFollow.ts
// Эта нода (на которой висит скрипт) будет следовать за другой нодой-целью
// ТОЛЬКО по оси X, без задержки.
// Оси Y и Z будут оставаться на своих начальных позициях.

import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NodeFollow')
export class NodeFollow extends Component {
 @property({ type: Node })
    target: Node | null = null;

    @property({ tooltip: 'Смещение по X относительно цели' })
    offsetX: number = 0;

    private _fixedY = 0;
    private _fixedZ = 0;
    private _tempTargetPos = new Vec3();
    private _tempSelfPos = new Vec3();

    start() {
        if (!this.target) {
            console.warn('NodeFollowXOnly: Target не назначен!');
            this.enabled = false;
            return;
        }

        // Зафиксируем текущие Y и Z позиции
        this.node.getWorldPosition(this._tempSelfPos);
        this._fixedY = this._tempSelfPos.y;
        this._fixedZ = this._tempSelfPos.z;

        // Обновим позицию сразу
        this.updatePosition();
    }

    lateUpdate() {
        if (!this.target) return;
        this.updatePosition();
    }

    private updatePosition() {
        this.target!.getWorldPosition(this._tempTargetPos);

        // Только по X следуем, остальное фиксируем
        this._tempSelfPos.set(
            this._tempTargetPos.x + this.offsetX,
            this._fixedY,
            this._fixedZ
        );

        this.node.setWorldPosition(this._tempSelfPos);
    }
}