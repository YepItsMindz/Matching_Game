import {
    _decorator,
    Component,
    Graphics,
    instantiate,
    Label,
    Node,
    Prefab,
    tween,
    Vec2,
    Vec3,
} from 'cc';
const { ccclass, property } = _decorator;

@ccclass('graphicAnim')
export class graphicAnim extends Component {
    @property(Prefab)
    starPrefab: Prefab = null;

    @property(Node)
    starEnd: Node = null;

    @property(Label)
    starScore: Label = null;

    @property(Prefab)
    particleEffect: Prefab = null;

    public destroyAnimDuration: number = 0.12;
    public starFlyAnimDuration: number = 0.7;

    pathAnim() {
        tween(this.node.getComponent(Graphics))
            .to(
                this.destroyAnimDuration,
                {},
                {
                    onComplete: (target: Graphics) => target.clear(),
                }
            )
            .start();
    }

    starAnim(node: Node, index: number) {
        const startPos = node.getWorldPosition();
        const endPos = this.starEnd.getWorldPosition();
        const controlPos = new Vec3(startPos.x, endPos.y + 50);
        const tempVec3 = new Vec3();
        setTimeout(() => {
            tween(node)
                .to(
                    this.starFlyAnimDuration,
                    {
                        worldPosition: endPos,
                    },
                    {
                        onUpdate: (target, ratio) => {
                            graphicAnim.quadraticCurve(
                                ratio,
                                startPos,
                                controlPos,
                                endPos,
                                tempVec3
                            );
                            target.worldPosition = tempVec3;
                        },
                    }
                )
                .call(() => {
                    const nodeTemp: Node = instantiate(this.particleEffect);
                    this.node.addChild(nodeTemp);
                    nodeTemp.setWorldPosition(endPos);
                    setTimeout(() => {
                        nodeTemp.active = false;
                    }, 1000);

                    this.starScore.string = (
                        parseInt(this.starScore.string) + 1
                    ).toString();

                    node.active = false;
                })
                .start();
        }, 50 * index);
    }

    static quadraticCurve(
        t: number,
        p1: Vec3 | Vec2,
        cp: Vec3 | Vec2,
        p2: Vec3 | Vec2,
        out: Vec3 | Vec2
    ) {
        out.x =
            (1 - t) * (1 - t) * p1.x + 2 * t * (1 - t) * cp.x + t * t * p2.x;

        out.y =
            (1 - t) * (1 - t) * p1.y + 2 * t * (1 - t) * cp.y + t * t * p2.y;
    }

    update(deltaTime: number) {}
}
