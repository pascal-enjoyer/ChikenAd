import { _decorator, Component, Node, view } from 'cc';
import { CameraFollow } from '../src/old/CameraFollow';
const { ccclass, property } = _decorator;

@ccclass('OrientationSwitcher')
export class OrientationSwitcher extends Component {
    @property(Node)
    portraitCanvas: Node | null = null;

    @property(Node)
    landscapeCanvas: Node | null = null;

    @property(CameraFollow)
    cameraFollow: CameraFollow | null = null;

    private _lastIsPortrait: boolean = false;

start() {
    this.scheduleOnce(() => {
        this._lastIsPortrait = this.isPortrait();
        this.applyOrientation(this._lastIsPortrait);
    }, 0.05); // задержка 50 мс (можно адаптировать)
}

    update() {
        const currentIsPortrait = this.isPortrait();
        if (currentIsPortrait !== this._lastIsPortrait) {
            this.applyOrientation(currentIsPortrait);
            this._lastIsPortrait = currentIsPortrait;
        }
    }

    private isPortrait(): boolean {
        const visibleSize = view.getVisibleSize();
        return visibleSize.height >= visibleSize.width;
    }

    private applyOrientation(isPortrait: boolean): void {
        if (this.portraitCanvas) this.portraitCanvas.active = isPortrait;
        if (this.landscapeCanvas) this.landscapeCanvas.active = !isPortrait;

        if (this.cameraFollow) {
            this.cameraFollow.applyOffsetForOrientation(isPortrait);
        }
    }
}