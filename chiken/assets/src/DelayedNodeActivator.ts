import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DelayedNodeActivator')
export class DelayedNodeActivator extends Component {

    @property(Node)
    private targetNode: Node | null = null; // Node, которую нужно активировать

    @property
    private delaySeconds: number = 2; // Задержка в секундах перед активацией

    private _isScheduled: boolean = false; // Флаг, чтобы избежать повторного планирования

    onEnable() {
        // onEnable вызывается каждый раз, когда Node (к которой прикреплен скрипт) становится активной
        if (this.targetNode && !this._isScheduled) {
            // Убедимся, что целевая Node изначально неактивна (если она не была такой)
            this.targetNode.active = false; 
            
            // Планируем активацию через delaySeconds
            this.scheduleOnce(this.activateTargetNode, this.delaySeconds);
            this._isScheduled = true; // Устанавливаем флаг, что планирование выполнено
        }
    }

    onDisable() {
        // onDisable вызывается, когда Node становится неактивной.
        // Отменяем запланированную активацию, если она еще не произошла.
        if (this._isScheduled) {
            this.unschedule(this.activateTargetNode);
            this._isScheduled = false;
        }
    }

    private activateTargetNode() {
        if (this.targetNode) {
            this.targetNode.active = true;
            // console.log(`Node '${this.targetNode.name}' activated after ${this.delaySeconds} seconds.`);
        }
        this._isScheduled = false; // Сбрасываем флаг после выполнения
    }
}