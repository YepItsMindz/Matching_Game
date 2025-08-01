import { _decorator, Component, Node, ProgressBarComponent } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('timer')
export class timer extends Component {
    @property(ProgressBarComponent)
    timer: ProgressBarComponent;

    static isRunning: boolean = false;
    
    reset() {
        this.timer.progress = 1;
    }

    update(deltaTime: number) {
        if (timer.isRunning) {
            this.timer.progress = Math.max(
                0,
                this.timer.progress - deltaTime / 60
            );
        }
    }
}
