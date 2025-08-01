import { _decorator, Component, instantiate, Prefab, tween, Vec3 } from 'cc';
import { timer } from './timer';
const { ccclass, property } = _decorator;

@ccclass('popups')
export class popups extends Component {
    @property(Prefab)
    settings: Prefab = null;
    static isPause: boolean = false;

    pauseGame() {
        if (!popups.isPause) {
            timer.isRunning = false;
            popups.isPause = true;
            const node = instantiate(this.settings);
            this.node.addChild(node);
            const settingBg = node.getChildByName('settingsBg');
            settingBg.setScale(new Vec3(0.5, 0.5, 0.5));
            tween(settingBg)
                .to(0.5, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .start();
        } else {
            popups.isPause = false;
        }
    }

    update(deltaTime: number) {}
}
