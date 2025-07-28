import { _decorator, Component, Graphics, Node, tween, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('lineAnim')
export class lineAnim extends Component {
    public destroyAnimDuration: number = 0.3;

    anim() {
        tween(this.node.getComponent(UIOpacity))
            .to(this.destroyAnimDuration, { opacity: 0 }, { easing: 'backIn' })
            .call(() => {
                this.node.getComponent(Graphics).clear();
                this.node.getComponent(UIOpacity).opacity = 255;
            })
            .start();
    }

    update(deltaTime: number) {}
}
