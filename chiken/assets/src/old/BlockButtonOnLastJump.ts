import { _decorator, Component, Node, Button } from 'cc';
import { LAST_JUMP_COMPLETED_EVENT } from './CharacterJump';
const { ccclass, property } = _decorator;

@ccclass('BlockButtonOnLastJump')
export class BlockButtonOnLastJump extends Component {
    @property({ type: Node, tooltip: 'Узел с компонентом CharacterJump для подписки на событие последнего прыжка' })
    characterJumpNode: Node | null = null;

    private _button: Button | null = null;

    onEnable() {
        console.log('BlockButtonOnLastJump: onEnable called');
        // Получаем компонент Button с текущего узла
        this._button = this.getComponent(Button);

        if (!this._button) {
            console.warn('BlockButtonOnLastJump: Button component not found on this node');
            this.enabled = false;
            return;
        }

        if (!this.characterJumpNode) {
            console.warn('BlockButtonOnLastJump: CharacterJump node is not assigned');
            this.enabled = false;
            return;
        }

        // Подписываемся на событие последнего прыжка
        console.log('BlockButtonOnLastJump: Subscribing to LAST_JUMP_COMPLETED_EVENT');
        this.characterJumpNode.on(LAST_JUMP_COMPLETED_EVENT, this.blockButton, this);
    }

    onDisable() {
        // Отписываемся от события при отключении компонента
        if (this.characterJumpNode) {
            console.log('BlockButtonOnLastJump: Unsubscribing from LAST_JUMP_COMPLETED_EVENT');
            this.characterJumpNode.off(LAST_JUMP_COMPLETED_EVENT, this.blockButton, this);
        }
    }

    private blockButton() {
        console.log('BlockButtonOnLastJump: LAST_JUMP_COMPLETED_EVENT received, blocking button');
        if (this._button) {
            this._button.enabled = false;
            console.log('BlockButtonOnLastJump: Button component disabled');
        } else {
            console.warn('BlockButtonOnLastJump: Button component not found during event');
        }
    }
}