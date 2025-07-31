import { _decorator, Component, Node, ProgressBarComponent } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('timer')
export class timer extends Component {
    @property(ProgressBarComponent)
    timer: ProgressBarComponent;

    static isClicked: boolean = false;
    start() {}

    update(deltaTime: number) {
        if (timer.isClicked) {
            this.timer.progress = Math.max(
                0,
                this.timer.progress - deltaTime / 60
            );
        }
    }
}
