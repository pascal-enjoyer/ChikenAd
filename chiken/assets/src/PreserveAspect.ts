import { _decorator, Component, Node, Sprite, Vec2, view, UITransform, size } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PreserveAspect')
export class PreserveAspect extends Component {
    @property(Sprite)
    sprite: Sprite = null;

    start() {
        this.adjustAspectRatio();
    }

    adjustAspectRatio() {
        const designSize = view.getDesignResolutionSize();
        const canvasSize = view.getCanvasSize();
        const node = this.node;
        const uiTransform = node.getComponent(UITransform);

        // Получаем размеры текстуры спрайта
        const spriteFrame = this.sprite.spriteFrame;
        if (!spriteFrame) return;

        const textureWidth = spriteFrame.originalSize.width;
        const textureHeight = spriteFrame.originalSize.height;
        const aspectRatio = textureWidth / textureHeight;

        // Получаем текущий размер узла
        const nodeSize = uiTransform.contentSize;
        const nodeWidth = nodeSize.width;
        const nodeHeight = nodeSize.height;
        const nodeAspectRatio = nodeWidth / nodeHeight;

        // Корректируем масштаб, чтобы сохранить пропорции
        if (nodeAspectRatio > aspectRatio) {
            // Если узел шире, чем нужно, масштабируем по высоте
            const scale = nodeHeight / textureHeight;
            uiTransform.setContentSize(size(textureWidth * scale, nodeHeight));
        } else {
            // Если узел выше, чем нужно, масштабируем по ширине
            const scale = nodeWidth / textureWidth;
            uiTransform.setContentSize(size(nodeWidth, textureHeight * scale));
        }
    }

    update() {
        // Если нужно, обновляйте при изменении размера экрана
        this.adjustAspectRatio();
    }
}