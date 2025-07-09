import { _decorator, Component } from 'cc';
import { NumberSplitter } from './NumberSplitter';
const { ccclass, property } = _decorator;

@ccclass('NotificationStarter')
export class NotificationStarter extends Component {
    @property({ type: NumberSplitter })  // Привяжите NumberSplitter в инспекторе
    private numberSplitter: NumberSplitter | null = null;

    onEnable() {
            this.numberSplitter.startSpawning();  // Только запуск спавна
    }
}