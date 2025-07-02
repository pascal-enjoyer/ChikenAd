import { _decorator, Component, Node, Canvas, UITransform, Camera } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraUIFollower')
export class CameraUIFollower extends Component {

    @property(Camera)
    targetCamera: Camera | null = null;

    @property(Canvas)
    uiCanvas: Canvas | null = null;

    start() {
        // Убеждаемся, что Canvas настроен правильно
        if (this.uiCanvas) {
            // Canvas должен быть в Screen Space
            this.uiCanvas.cameraComponent = this.targetCamera;
            
            // Устанавливаем UI Canvas как дочерний от Camera
            if (this.targetCamera) {
                this.uiCanvas.node.parent = this.targetCamera.node;
                
                // Сбрасываем локальные координаты
                this.uiCanvas.node.setPosition(0, 0, 0);
                this.uiCanvas.node.setRotationFromEuler(0, 0, 0);
                this.uiCanvas.node.setScale(1, 1, 1);
            }
        }
    }
}