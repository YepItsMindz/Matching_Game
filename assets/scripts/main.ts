import {
    _decorator,
    Button,
    CCInteger,
    Component,
    Graphics,
    instantiate,
    JsonAsset,
    Node,
    path,
    Prefab,
    resources,
    Sprite,
    SpriteAtlas,
    SpriteFrame,
    UITransform,
    Vec2,
    Vec3,
} from 'cc';
import { tilePrefab } from './prefab/tilePrefab';
import { lineAnim } from './prefab/lineAnim';
const { ccclass, property } = _decorator;

export const TILE_SIZE = 105;
@ccclass('main')
export class main extends Component {
    @property(SpriteAtlas)
    spriteAtlas: SpriteAtlas = null;

    @property(JsonAsset)
    jsonAsset: JsonAsset = null;

    @property(CCInteger)
    matrixWidth: number = null;

    @property(CCInteger)
    matrixHeight: number = null;

    @property(Prefab)
    tilePrefab: Prefab = null;

    @property(Graphics)
    graphic: Graphics = null;

    private isConnect: boolean = true;
    private preTile: tilePrefab = null;

    private matrixTiles: tilePrefab[][] = null;

    protected onLoad(): void {
        //Create Map
        const map = this.jsonAsset.json.data.map;
        this.matrixWidth = this.jsonAsset.json.data.tilesAmount;
        this.matrixHeight = this.jsonAsset.json.data.tilesAmount;

        //Init
        this.matrixTiles = [];
        for (let i = 0; i < this.matrixWidth + 1; i++) {
            this.matrixTiles[i] = [];
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
            this.node.addChild(nodeTemp);
        });
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
                //Draw the connected line
                let [x0, y0] = shortPath.shift();
                while (shortPath.length > 0) {
                    const [x1, y1] = shortPath.shift();
                    const startPos = this.convertMatixToVec3(x0, y0);
                    const endPos = this.convertMatixToVec3(x1, y1);
                    this.drawLine(startPos, endPos);
                    [x0, y0] = [x1, y1];
                }

                //Destroy connected tiles
                this.matrixTiles[this.preTile.posMatrixX][
                    this.preTile.posMatrixY
                ] = null;
                this.matrixTiles[comp.posMatrixX][comp.posMatrixY] = null;
                this.graphic.getComponent(lineAnim).anim();
                this.preTile.onDestroy();
                comp.onDestroy();
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
        const rows = this.matrixHeight;
        const cols = this.matrixWidth;
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
    }

    convertMatixToVec3(x: number, y: number): Vec3 {
        return new Vec3(
            (x - (this.matrixWidth - 1) / 2) * TILE_SIZE,
            (y - (this.matrixHeight - 1) / 2) * TILE_SIZE,
            1
        );
    }

    update(deltaTime: number) {}
}
