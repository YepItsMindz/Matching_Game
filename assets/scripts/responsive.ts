import { _decorator, Component, Node, ResolutionPolicy, view } from 'cc';
const { ccclass, property } = _decorator;

const ratio = 1280 / 720;

@ccclass('responsive')
export class responsive extends Component {
    onLoad() {
        const screenSize = view.getVisibleSize();
        const currentRatio = screenSize.height / screenSize.width;
        if (currentRatio < ratio) {
            view.setResolutionPolicy(ResolutionPolicy.FIXED_HEIGHT);
        }
    }

    update(deltaTime: number) {}
}
