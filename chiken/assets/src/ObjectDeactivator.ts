import { _decorator, Component, Button, Node } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ObjectDeactivator')
export class ObjectDeactivator extends Component {
    @property({ type: Button })
    public deactivateButton: Button | null = null;

    start() {
        if (this.deactivateButton) {
            this.deactivateButton.node.on('click', this.deactivateNode, this);
        }
    }

    deactivateNode() {
        this.node.active = false;
    }

    onDestroy() {
        if (this.deactivateButton) {
            this.deactivateButton.node.off('click', this.deactivateNode, this);
        }
    }
}