import { _decorator, Component, Node, Widget } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('OneFrameWidgetActivator')
export class OneFrameWidgetActivator extends Component {

    // Изменено на массив Node
    @property({ type: [Node], tooltip: 'Массив нод с Widget, которые должны быть выровнены при старте' })
    widgetNodes: Node[] = []; // Используем [] для обозначения массива

    start() {
        if (this.widgetNodes.length === 0) {
            console.warn('OneFrameWidgetActivator: Массив widgetNodes пуст. Нет нод для обработки.');
            return;
        }

        // Перебираем каждую ноду в массиве
        this.widgetNodes.forEach(node => {
            if (!node) {
                console.warn('OneFrameWidgetActivator: Обнаружена пустая (null) ссылка в массиве widgetNodes. Пропускаем ее.');
                return; // Пропускаем null-элементы в массиве
            }

            // Включаем ноду на один кадр
            node.active = true;

            // Ждём один кадр, затем применяем выравнивание и выключаем обратно
            this.scheduleOnce(() => {
                const widget = node.getComponent(Widget);
                if (widget) {
                    widget.updateAlignment(); // Принудительно обновляем выравнивание
                   // widget.enabled = false;   // Отключаем Widget, чтобы он не мешал в дальнейшем
                } else {
                    console.warn(`OneFrameWidgetActivator: На ноде "${node.name}" отсутствует компонент Widget.`);
                }

                node.active = false; // Обратно выключаем ноду
            }, 0); // 0 секунд задержки означает "в следующем кадре"
        });
    }
}