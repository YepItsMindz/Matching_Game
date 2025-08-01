import { _decorator, Component, Node, tween, Vec3, find } from 'cc';
import { timer } from '../timer';
import { popups } from '../popups';
import { main } from '../main';
const { ccclass, property } = _decorator;

@ccclass('settings')
export class settings extends Component {
    close() {
        timer.isRunning = true;
        popups.isPause = false;
        const settingBg = this.node.getChildByName('settingsBg');
        tween(settingBg)
            .to(0.5, { scale: new Vec3(0.2, 0.2, 0.2) }, { easing: 'backIn' })
            .call(() => {
                this.node.active = false;
            })
            .start();
    }

    resetGame() {
        this.close();
        setTimeout(() => {
            const mainComponent = this.node.parent.parent
                .getChildByName('main')
                .getComponent(main);
            mainComponent.reset();

            const timerComponent = this.node.parent.parent
                .getChildByName('header')
                .getChildByName('ProgressBar')
                .getComponent(timer);
            if (timerComponent) {
                timerComponent.reset();
            }
            timer.isRunning = false;
        }, 500);
    }

    update(deltaTime: number) {}
}
