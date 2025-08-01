import { _decorator, Component, Node, tween, UIOpacity, Vec3 } from 'cc';
import { main } from '../main';
import { timer } from '../timer';
const { ccclass, property } = _decorator;

@ccclass('vicAnim')
export class vicAnim extends Component {
    @property(Node)
    chestProgress: Node = null;

    @property(Node)
    click2Continue: Node = null;

    @property(Node)
    screen: Node = null;

    private duration: number = 1.5;

    protected onEnable(): void {
        tween(this.click2Continue)
            .to(0, { scale: new Vec3(0, 0, 0) })
            .to(
                this.duration,
                { scale: new Vec3(1, 1, 1) },
                { easing: 'backOut' }
            )
            .start();
        tween(this.chestProgress)
            .to(0, { scale: new Vec3(0, 0, 0) })
            .to(
                this.duration,
                { scale: new Vec3(1, 1, 1) },
                { easing: 'backOut' }
            )
            .start();

        const uiOpacity = this.screen.getComponent(UIOpacity);
        if (uiOpacity) {
            tween(uiOpacity).to(0.5, { opacity: 255 }).start();
        }
    }

    playNext() {
        const mainNode = this.node.parent;
        const mainComponent = mainNode.getComponent(main);
        if (mainComponent) {
            mainComponent.curLevel += 1;
            mainComponent.loadLevel(mainComponent.curLevel);
            mainComponent.progress.progress = 1;
            mainComponent.label.string = 'Level ' + mainComponent.curLevel;
            timer.isRunning = false;
            this.node.active = false;
        }
    }

    update(deltaTime: number) {}
}
