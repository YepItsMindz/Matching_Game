import {
    _decorator,
    Button,
    CCInteger,
    Component,
    Graphics,
    instantiate,
    JsonAsset,
    Label,
    Node,
    path,
    Prefab,
    ProgressBar,
    resources,
    Sprite,
    SpriteAtlas,
    SpriteFrame,
    tween,
    UITransform,
    Vec2,
    Vec3,
} from 'cc';
import { tilePrefab } from './prefab/tilePrefab';
import { lineAnim } from './prefab/lineAnim';
import { timer } from './timer';
const { ccclass, property } = _decorator;

export const TILE_SIZE = 105;
@ccclass('main')
export class main extends Component {
    @property(SpriteAtlas)
    spriteAtlas: SpriteAtlas = null;

    @property(JsonAsset)
    jsonAsset: JsonAsset = null;

    @property(Prefab)
    tilePrefab: Prefab = null;

    @property(Prefab)
    starPrefab: Prefab = null;

    @property(Graphics)
    graphic: Graphics = null;

    @property(Prefab)
    victory: Prefab = null;

    @property(Label)
    label: Label = null;

    @property(ProgressBar)
    progress: ProgressBar = null;

    public matrixWidth: number = null;
    public matrixHeight: number = null;

    public isConnect: boolean = true;
    public preTile: tilePrefab = null;

    public matrixTiles: tilePrefab[][] = null;
    public level: Node[] = [];

    public curLevel: number = 1;
    public victoryTmp: Node = null;

    protected onLoad(): void {
        this.loadLevel(this.curLevel);
    }

    loadLevel(index: number) {
        let name = 'level-' + index;
        resources.load(`data/${name}`, JsonAsset, (err, jsonAsset) => {
            if (err) {
                console.error(`Failed to load ${name}:`, err);
            } else {
                const childNode: Node = new Node(name);
                childNode.name = name;
                this.createMap(childNode, jsonAsset);
                this.level[index] = childNode;
                childNode.scale = new Vec3(0.2, 0.2, 0.2);
                this.node.addChild(childNode);
                this.levelAppear(this.node.getChildByName(childNode.name));
            }
        });
    }

    levelAppear(node: Node) {
        tween(node)
            .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'fade' })
            .start();
    }

    createMap(childNode: Node, jsonAsset: JsonAsset) {
        //Create Map
        this.matrixWidth = 0;
        this.matrixHeight = 0;
        const map = jsonAsset.json.data.map;
        map.forEach((item, index) => {
            this.matrixWidth = Math.max(this.matrixWidth, item.x + 1);
            this.matrixHeight = Math.max(this.matrixHeight, item.y + 1);
        });

        //Init
        this.matrixTiles = [];
        for (let i = 0; i < this.matrixWidth; i++) {
            this.matrixTiles[i] = [];
            for (let j = 0; j < this.matrixHeight; j++) {
                this.matrixTiles[i][j] = null;
            }
        }

        map.forEach((item, index) => {
            const nodeTemp: Node = instantiate(this.tilePrefab);
            const comp = nodeTemp.getComponent(tilePrefab);
            comp.posMatrixX = item.x;
            comp.posMatrixY = item.y;
            this.matrixTiles[item.x][item.y] = comp;

            //Set SpriteFrame
            const frame = this.spriteAtlas.getSpriteFrame(
                'episode-2-tile-' + item.number
            );
            comp.setImage(frame);

            //Set Position
            nodeTemp.setPosition(this.convertMatixToVec3(item.x, item.y));

            //Set Function
            comp.init(index, () => {
                if (this.isConnect) {
                    this.connected(comp);
                } else {
                    this.unconnected(comp);
                }
            });

            //Show
            childNode.addChild(nodeTemp);
        });
        console.log(this.matrixTiles);
    }

    connected(comp: tilePrefab) {
        this.preTile = comp;
        this.isConnect = false;
    }

    unconnected(comp: tilePrefab) {
        const isCorrect = this.preTile.compare(comp);
        if (isCorrect) {
            const shortPath = this.shortestPath(
                [this.preTile.posMatrixX, this.preTile.posMatrixY],
                [comp.posMatrixX, comp.posMatrixY]
            );

            if (shortPath) {
                const starNodes: { node: Node; y: number }[] = [];

                for (let i = 0; i < shortPath.length - 1; i++) {
                    const [x0, y0] = shortPath[i];
                    const [x1, y1] = shortPath[i + 1];

                    const nodeTemp = instantiate(this.starPrefab);
                    nodeTemp.setPosition(this.convertMatixToVec3(x0, y0));
                    this.graphic.node.addChild(nodeTemp);
                    starNodes.push({ node: nodeTemp, y: y0 });

                    const startPos = this.convertMatixToVec3(x0, y0);
                    const endPos = this.convertMatixToVec3(x1, y1);
                    this.drawLine(startPos, endPos);
                }
                // Instantiate the last node at the end position
                const [lastX, lastY] = shortPath[shortPath.length - 1];
                const lastNode = instantiate(this.starPrefab);
                lastNode.setPosition(this.convertMatixToVec3(lastX, lastY));
                this.graphic.node.addChild(lastNode);
                starNodes.push({ node: lastNode, y: lastY });

                // Sort and animate
                starNodes.sort((a, b) => b.y - a.y);
                starNodes.forEach((star, index) => {
                    this.graphic
                        .getComponent(lineAnim)
                        .starAnim(star.node, index);
                });

                //Destroy connected tiles
                this.matrixTiles[this.preTile.posMatrixX][
                    this.preTile.posMatrixY
                ] = null;
                this.matrixTiles[comp.posMatrixX][comp.posMatrixY] = null;
                this.graphic.getComponent(lineAnim).anim();
                this.preTile.onDestroy();
                comp.onDestroy();

                this.isVictory();
            } else {
                this.preTile.onWrong();
                comp.onWrong();
            }
        }
        this.preTile = null;
        this.isConnect = true;
    }

    shortestPath(
        start: [number, number],
        end: [number, number]
    ): [number, number][] | null {
        const matrix = this.matrixTiles;
        const rows = this.matrixWidth;
        const cols = this.matrixHeight;
        const directions = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ];
        const visited = Array.from({ length: rows }, () =>
            Array(cols).fill(false)
        );
        const parentPosition = Array.from({ length: rows }, () =>
            Array(cols).fill(null)
        );
        const parentDirection = Array.from({ length: rows }, () =>
            Array(cols).fill(null)
        );
        const directionChanges = Array.from({ length: rows }, () =>
            Array(cols).fill(0)
        );
        const queue: [number, number, number][] = []; // [x, y, numDirectionChanges]

        queue.push([start[0], start[1], 0]);
        visited[start[0]][start[1]] = true;
        parentDirection[start[0]][start[1]] = [0, 0];
        directionChanges[start[0]][start[1]] = 0;

        while (queue.length > 0) {
            const [x, y, currentDirectionChanges] = queue.shift();

            if (x === end[0] && y === end[1]) {
                let path: [number, number][] = [];
                let cur: [number, number] | null = end;

                while (cur) {
                    path.push(cur);
                    cur = parentPosition[cur[0]][cur[1]];
                }
                path.reverse();
                return path;
            }

            for (let [dx, dy] of directions) {
                let nx = x + dx;
                let ny = y + dy;

                if (
                    nx >= 0 &&
                    ny >= 0 &&
                    nx < rows &&
                    ny < cols &&
                    !visited[nx][ny]
                ) {
                    const isDestination: boolean =
                        nx === end[0] && ny === end[1];
                    const isEmpty: boolean = matrix[nx][ny] == null;

                    if (isEmpty || isDestination) {
                        let newDirectionChanges = currentDirectionChanges;

                        // Check if direction changed
                        if (
                            parentDirection[x][y] &&
                            (parentDirection[x][y][0] !== dx ||
                                parentDirection[x][y][1] !== dy)
                        ) {
                            newDirectionChanges += 1;
                        }

                        if (newDirectionChanges <= 3) {
                            visited[nx][ny] = true;
                            parentPosition[nx][ny] = [x, y];
                            parentDirection[nx][ny] = [dx, dy];
                            directionChanges[nx][ny] = newDirectionChanges;
                            queue.push([nx, ny, newDirectionChanges]);
                        }
                    }
                }
            }
        }
        return null;
    }

    drawLine(startPos: Vec3, endPos: Vec3) {
        this.graphic.moveTo(startPos.x, startPos.y);
        this.graphic.lineTo(endPos.x, endPos.y);
        this.graphic.stroke();
        this.graphic.circle(endPos.x, endPos.y, 8);
        this.graphic.fill();
    }

    convertMatixToVec3(x: number, y: number): Vec3 {
        return new Vec3(
            (x - (this.matrixWidth - 1) / 2) * TILE_SIZE,
            (y - (this.matrixHeight - 1) / 2) * TILE_SIZE,
            1
        );
    }

    isVictory() {
        const isEmpty = this.matrixTiles.every(row =>
            row.every(tile => tile == null)
        );
        if (isEmpty) {
            timer.isClicked = false;
            setTimeout(() => {
                this.victoryTmp = instantiate(this.victory);
                this.node.addChild(this.victoryTmp);
            }, 500);
            return true;
        }
        return false;
    }

    update(deltaTime: number) {}
}
