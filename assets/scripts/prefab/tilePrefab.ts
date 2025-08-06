import {
    _decorator,
    Button,
    Component,
    Node,
    Sprite,
    SpriteFrame,
    tween,
    Tween,
    Vec3,
} from 'cc';
import { timer } from '../timer';
const { ccclass, property } = _decorator;

@ccclass('tilePrefab')
export class tilePrefab extends Component {
    @property(Sprite)
    tile: Sprite = null;

    @property(Sprite)
    tileSelected: Sprite = null;

    @property(Sprite)
    tileWrongSelected: Sprite = null;

    @property(Sprite)
    tileHintSelected: Sprite = null;

    @property(Node)
    explodeEffect: Node = null;

    public wrongAnimDuration: number = 0.4;
    public clickAnimDuration: number = 0.1;
    public destroyAnimDuration: number = 0.25;

    private index: number = null;
    private callback: Function = null;

    public isHint: boolean = false;
    public isClicked: boolean = false;
    private hintTween: Tween<Node> = null;

    public posMatrixX: number = null;
    public posMatrixY: number = null;

    init(index: number, callbackFunction: Function) {
        this.index = index;
        this.callback = callbackFunction;
    }

    setImage(spriteFrame: SpriteFrame) {
        this.tile.spriteFrame = spriteFrame;
    }

    compareTiles(comp: tilePrefab): boolean {
        if (this.tile.spriteFrame.name === comp.tile.spriteFrame.name) {
            return true;
        } else {
            return false;
        }
    }

    onClick() {
        if (this.isHint) {
            this.tileHintSelected.node.active = false;
            if (this.hintTween) {
                this.hintTween.stop();
                this.hintTween = null;
            }
            this.tile.node.scale = new Vec3(1, 1, 1);
            this.isHint = false;
        }
        this.isClicked = true;
        this.getComponent(Button).interactable = false;
        this.tileSelected.node.active = true;
        tween(this.node)
            .to(
                this.clickAnimDuration,
                { scale: new Vec3(1.05, 1.05, 1) },
                { easing: 'backOut' }
            )
            .call(() => {
                this.callback && this.callback(this.index);
            })
            .start();
    }

    onWrong() {
        this.tileSelected.node.active = false;
        this.tileWrongSelected.node.active = true;
        tween(this.node)
            .to(
                this.clickAnimDuration,
                { scale: new Vec3(1.1, 1.1, 1) },
                { easing: 'backOut' }
            )
            .to(
                this.wrongAnimDuration,
                { scale: new Vec3(1, 1, 1) },
                { easing: 'backIn' }
            )
            .call(() => {
                this.tileWrongSelected.node.active = false;
                this.getComponent(Button).interactable = true;
            })
            .start();
        this.isClicked = false;
    }

    onNormal() {
        this.tileSelected.node.active = false;
        this.getComponent(Button).interactable = true;
        tween(this.node)
            .to(
                this.clickAnimDuration,
                { scale: new Vec3(1, 1, 1) },
                { easing: 'backIn' }
            )
            .start();
        this.isClicked = false;
    }

    onDestroy() {
        timer.isRunning = true;
        tween(this.node.getChildByName('tile'))
            .to(
                this.destroyAnimDuration,
                { scale: new Vec3(0, 0, 0) },
                { easing: 'backIn' }
            )
            .call(() => {})
            .start();
        this.explodeEffect.active = true;
        setTimeout(() => {
            this.node.active = false;
        }, 700);
        this.isClicked = false;
    }

    onHint() {
        if (!this.isHint) {
            this.isHint = true;
            this.tileHintSelected.node.active = true;

            this.hintTween = tween(this.tile.node)
                .to(
                    0.5,
                    { scale: new Vec3(1.05, 1.05, 1.05) },
                    { easing: 'sineInOut' }
                )
                .to(
                    0.5,
                    { scale: new Vec3(0.9, 0.9, 0.9) },
                    { easing: 'sineInOut' }
                )
                .union()
                .repeatForever()
                .start();
        } else {
            this.tileHintSelected.node.active = false;
            if (this.hintTween) {
                this.hintTween.stop();
                this.hintTween = null;
            }
            this.tile.node.scale = new Vec3(1, 1, 1);
            this.isHint = false;
        }
    }
}
