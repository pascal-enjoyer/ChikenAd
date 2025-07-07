import { _decorator, Component, Node, Camera, Vec3, view, tween, geometry } from 'cc';
import { CharacterJump } from './CharacterJump';
const { ccclass, property } = _decorator;

@ccclass('CameraFollow')
export class CameraFollow extends Component {
    /* Публичные свойства */
    @property({ type: Node }) target: Node | null = null;
    @property({ type: Node }) finalNode: Node | null = null;
    @property({ type: Node }) leftEdgeNode: Node | null = null;
    @property({ type: Camera }) gameCamera: Camera | null = null;
    @property({ type: CharacterJump }) characterJump: CharacterJump | null = null;
    @property offsetPortraitX = 0;
    @property smoothFollow = true;
    @property followSpeed = 5;
    @property offsetTransitionDuration = 0.5;

    /* Приватные поля */
    private _currentOffsetX = 0;
    private _tempTargetPos = new Vec3();
    private _tempCamPos = new Vec3();
    private _initialY = 0;
    private _initialZ = 0;
    private _hasOffsetTransitioned = false;
    private _isLandscape = false;
    private _shouldFollow = false;
    private _screenCenterThreshold = 0.5;
    private _leftEdgeWorldX = 0;
    private _fixedCameraX = 0;

    start() {
        if (!this.target) { this.enabled = false; return; }
        if (!this.gameCamera) this.gameCamera = this.getComponent(Camera);
        if (!this.characterJump) this.characterJump = this.target.getComponent(CharacterJump);

        this.node.getWorldPosition(this._tempCamPos);
        this._initialY = this._tempCamPos.y;
        this._initialZ = this._tempCamPos.z;

        this._isLandscape = view.getVisibleSize().height < view.getVisibleSize().width;
        this.applyOffsetForOrientation(!this._isLandscape);

        if (this.leftEdgeNode) {
            this.calculateLeftEdgePosition();
            this._fixedCameraX = this._leftEdgeWorldX;
            this.updateCameraPosition(0);
        }
    }

    private calculateLeftEdgePosition() {
        if (!this.leftEdgeNode || !this.gameCamera) return;

        const nodeWorldPos = new Vec3();
        this.leftEdgeNode.getWorldPosition(nodeWorldPos);
        const cameraHalfWidth = this.getCameraHalfWidth();
        this._leftEdgeWorldX = nodeWorldPos.x + cameraHalfWidth; // Левый край камеры совпадает с leftEdgeNode
    }

    private getCameraHalfWidth(): number {
        if (!this.gameCamera) return 0;

        if (this.gameCamera.orthoHeight) {
            const aspect = view.getVisibleSize().width / view.getVisibleSize().height;
            return this.gameCamera.orthoHeight * aspect;
        } else {
            const distance = Math.abs(this.node.worldPosition.z);
            const fovRad = this.gameCamera.fov * Math.PI / 180;
            const halfHeight = distance * Math.tan(fovRad / 2);
            const aspect = view.getVisibleSize().width / view.getVisibleSize().height;
            return halfHeight * aspect;
        }
    }

    lateUpdate(dt: number) {
        if (!this.target || !this.gameCamera) return;

        // Проверяем ориентацию в каждом кадре
        const isPortraitNow = view.getVisibleSize().height >= view.getVisibleSize().width;
        if (this._isLandscape !== !isPortraitNow) {
            this._isLandscape = !isPortraitNow;
            this.applyOffsetForOrientation(isPortraitNow);
            this._shouldFollow = false;
        }

        // Пересчитываем позицию leftEdgeNode в каждом кадре
        if (this.leftEdgeNode) {
            this.calculateLeftEdgePosition();
            this._fixedCameraX = this._leftEdgeWorldX;
        }

        this.handleCameraMovement(dt);
    }

    private handleCameraMovement(dt: number) {
        if (!this.target || !this.gameCamera) {
            this.updateCameraPosition(dt);
            return;
        }

        this.target.getWorldPosition(this._tempTargetPos);
        const chickenScreenPos = this.gameCamera.worldToScreen(this._tempTargetPos);
        const screenWidth = view.getVisibleSize().width;
        const chickenScreenX = chickenScreenPos.x / screenWidth;

        if (chickenScreenX >= this._screenCenterThreshold) {
            this._shouldFollow = true;
        }

        if (this.finalNode && this._shouldFollow) {
            const finalNodeWorldPos = new Vec3();
            this.finalNode.getWorldPosition(finalNodeWorldPos);
            const finalNodeScreenPos = this.gameCamera.worldToScreen(finalNodeWorldPos);
            const finalNodeScreenX = finalNodeScreenPos.x / screenWidth;

            if (finalNodeScreenX <= 0.5) {
                this._shouldFollow = false;
                this.node.getWorldPosition(this._tempCamPos);
                this._fixedCameraX = this._tempCamPos.x;
            }
        }

        if (this._shouldFollow) {
            this.updateCameraPosition(dt);
        } else {
            this.node.getWorldPosition(this._tempCamPos);
            this._tempCamPos.x = this._fixedCameraX;
            this._tempCamPos.y = this._initialY;
            this._tempCamPos.z = this._initialZ;
            this.node.setWorldPosition(this._tempCamPos);
        }
    }

    private updateCameraPosition(dt: number) {
        if (!this.target) return;

        this.target.getWorldPosition(this._tempTargetPos);
        
        const screenWidth = view.getVisibleSize().width;
        const cameraWidth = this.getCameraHalfWidth() * 2;
        const scaledOffsetX = this._currentOffsetX * (cameraWidth / screenWidth);
        let desiredX = this._tempTargetPos.x + scaledOffsetX;

        // Ограничиваем позицию камеры, чтобы левый край не уходил левее leftEdgeNode
        if (this.leftEdgeNode) {
            desiredX = Math.max(desiredX, this._leftEdgeWorldX);
        }

        this.node.getWorldPosition(this._tempCamPos);

        if (this.smoothFollow) {
            this._tempCamPos.x = this._tempCamPos.x + (desiredX - this._tempCamPos.x) * Math.min(1, dt * this.followSpeed);
        } else {
            this._tempCamPos.x = desiredX;
        }

        this._tempCamPos.y = this._initialY;
        this._tempCamPos.z = this._initialZ;
        this.node.setWorldPosition(this._tempCamPos);
        
        if (this._shouldFollow) {
            this._fixedCameraX = this._tempCamPos.x;
        }
    }

    public applyOffsetForOrientation(isPortrait: boolean) {
        if (isPortrait && this.characterJump && this.characterJump.hasJumped && !this._hasOffsetTransitioned) {
            const offsetObj = { value: this._currentOffsetX };
            tween(offsetObj)
                .to(this.offsetTransitionDuration, { value: 0 }, { 
                    easing: 'sineOut',
                    onUpdate: (target: any) => {
                        this._currentOffsetX = target.value;
                    }
                })
                .call(() => {
                    this._hasOffsetTransitioned = true;
                })
                .start();
        } else if (!isPortrait || (isPortrait && (!this.characterJump || !this.characterJump.hasJumped))) {
            this._currentOffsetX = isPortrait ? this.offsetPortraitX : 0;
            this._hasOffsetTransitioned = false;
        }
    }
}