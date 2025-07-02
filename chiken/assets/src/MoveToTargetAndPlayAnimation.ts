import { _decorator, Component, Node, Vec3, tween, Animation, AnimationClip } from 'cc';
import { LAST_JUMP_COMPLETED_EVENT } from './CharacterJump';
const { ccclass, property } = _decorator;

@ccclass('MoveToTargetAndPlayAnimation')
export class MoveToTargetAndPlayAnimation extends Component {
    @property({ type: Node, tooltip: 'Целевой узел, в центр которого будет перемещён объект' })
    targetNode: Node | null = null;

    @property({ type: String, tooltip: 'Имя анимации для воспроизведения после перемещения' })
    animationName: string = '';

    @property({ type: Node, tooltip: 'Узел с компонентом CharacterJump для подписки на событие' })
    characterJumpNode: Node | null = null;

    @property({ type: Number, tooltip: 'Длительность перемещения (в секундах)' })
    moveDuration: number = 1.0;

    private _animation: Animation | null = null;

    onEnable() {
        console.log('MoveToTargetAndPlayAnimation: onEnable called');
        // Получаем компонент Animation с текущего узла
        this._animation = this.getComponent(Animation);

        if (!this.targetNode) {
            console.warn('MoveToTargetAndPlayAnimation: Target node is not assigned');
            this.enabled = false;
            return;
        }

        if (!this._animation) {
            console.warn('MoveToTargetAndPlayAnimation: Animation component is not assigned');
            this.enabled = false;
            return;
        }

        if (!this.animationName) {
            console.warn('MoveToTargetAndPlayAnimation: Animation name is not assigned');
            this.enabled = false;
            return;
        }

        if (!this.characterJumpNode) {
            console.warn('MoveToTargetAndPlayAnimation: CharacterJump node is not assigned');
            this.enabled = false;
            return;
        }

        // Проверяем, существует ли анимационный клип
        const clips = this._animation.clips;
        const clipExists = clips.some(clip => clip && clip.name === this.animationName);
        if (!clipExists) {
            console.warn(`MoveToTargetAndPlayAnimation: Animation clip "${this.animationName}" not found`);
            this.enabled = false;
            return;
        }

        // Подписываемся на событие последнего прыжка
        console.log('MoveToTargetAndPlayAnimation: Subscribing to LAST_JUMP_COMPLETED_EVENT');
        this.characterJumpNode.on(LAST_JUMP_COMPLETED_EVENT, this.moveToTargetAndPlay, this);
    }

    onDisable() {
        // Отписываемся от события при отключении компонента
        if (this.characterJumpNode) {
            console.log('MoveToTargetAndPlayAnimation: Unsubscribing from LAST_JUMP_COMPLETED_EVENT');
            this.characterJumpNode.off(LAST_JUMP_COMPLETED_EVENT, this.moveToTargetAndPlay, this);
        }
    }

    public moveToTargetAndPlay() {
        console.log('MoveToTargetAndPlayAnimation: moveToTargetAndPlay called');
        if (!this.targetNode) {
            console.warn('MoveToTargetAndPlayAnimation: Cannot move, targetNode is null');
            return;
        }

        // Деактивируем узел перед началом перемещения
        console.log('MoveToTargetAndPlayAnimation: Deactivating node');
        this.node.active = false;

        // Получаем родительский узел текущего объекта
        const parentNode = this.node.parent;
        if (!parentNode) {
            console.warn('MoveToTargetAndPlayAnimation: Node has no parent, using world position without offset');
            this.moveToTargetWithoutOffset();
            return;
        }

        // Вычисляем оффсет текущего узла относительно его родителя
        const currentWorldPos = this.node.getWorldPosition();
        const parentWorldPos = parentNode.getWorldPosition();
        const offset = new Vec3(
            currentWorldPos.x - parentWorldPos.x,
            currentWorldPos.y - parentWorldPos.y,
            0 // Игнорируем Z для сохранения текущей глубины
        );
        console.log(`MoveToTargetAndPlayAnimation: Calculated offset: ${offset}`);

        // Получаем мировую позицию целевого узла
        const targetWorldPos = this.targetNode.getWorldPosition();

        // Вычисляем новую целевую позицию с учётом оффсета
        const newTargetPos = new Vec3(
            targetWorldPos.x + offset.x,
            targetWorldPos.y + offset.y,
            targetWorldPos.z // Сохраняем Z целевого узла
        );
        console.log(`MoveToTargetAndPlayAnimation: Moving to new target position: ${newTargetPos}`);

        // Плавно перемещаем текущий узел в новую позицию
        tween(this.node)
            .to(this.moveDuration, { worldPosition: newTargetPos }, { easing: 'sineOut' })
            .call(() => {
                console.log('MoveToTargetAndPlayAnimation: Movement completed');
                // Подготавливаем анимацию перед активацией узла
                if (this._animation && this.animationName) {
                    // Останавливаем текущую анимацию, если она есть
                    this._animation.stop();
                    // Устанавливаем начальное состояние анимации
                    const clip = this._animation.clips.find(c => c && c.name === this.animationName);
                    if (clip) {
                        const state = this._animation.createState(clip, this.animationName);
                        state.time = 0; // Устанавливаем анимацию на начальный кадр
                        console.log(`MoveToTargetAndPlayAnimation: Animation "${this.animationName}" prepared at time 0`);
                    } else {
                        console.warn(`MoveToTargetAndPlayAnimation: Failed to prepare animation "${this.animationName}"`);
                    }
                }
                // Активируем узел
                console.log('MoveToTargetAndPlayAnimation: Activating node');
                this.node.active = true;
                // Воспроизводим анимацию сразу после активации
                if (this._animation && this.animationName) {
                    console.log(`MoveToTargetAndPlayAnimation: Playing animation "${this.animationName}"`);
                    this._animation.play(this.animationName);
                } else {
                    console.warn('MoveToTargetAndPlayAnimation: Animation component or name missing during playback');
                }
            })
            .start();
    }

    private moveToTargetWithoutOffset() {
        // Запасной метод для перемещения без оффсета, если нет родителя
        console.log('MoveToTargetAndPlayAnimation: Deactivating node');
        this.node.active = false;
        const targetWorldPos = this.targetNode!.getWorldPosition();
        console.log(`MoveToTargetAndPlayAnimation: Moving to target position without offset: ${targetWorldPos}`);
        tween(this.node)
            .to(this.moveDuration, { worldPosition: targetWorldPos }, { easing: 'sineOut' })
            .call(() => {
                console.log('MoveToTargetAndPlayAnimation: Movement completed');
                // Подготавливаем анимацию перед активацией узла
                if (this._animation && this.animationName) {
                    this._animation.stop();
                    const clip = this._animation.clips.find(c => c && c.name === this.animationName);
                    if (clip) {
                        const state = this._animation.createState(clip, this.animationName);
                        state.time = 0; // Устанавливаем анимацию на начальный кадр
                        console.log(`MoveToTargetAndPlayAnimation: Animation "${this.animationName}" prepared at time 0`);
                    }
                }
                // Активируем узел
                console.log('MoveToTargetAndPlayAnimation: Activating node');
                this.node.active = true;
                // Воспроизводим анимацию
                if (this._animation && this.animationName) {
                    console.log(`MoveToTargetAndPlayAnimation: Playing animation "${this.animationName}"`);
                    this._animation.play(this.animationName);
                }
            })
            .start();
    }

    // Публичный метод для ручного тестирования
    public testMoveToTarget() {
        console.log('MoveToTargetAndPlayAnimation: testMoveToTarget called');
        this.moveToTargetAndPlay();
    }
}