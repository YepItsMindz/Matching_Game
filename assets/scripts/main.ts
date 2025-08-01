import {
    _decorator,
    Button,
    Component,
    Graphics,
    instantiate,
    JsonAsset,
    Label,
    Node,
    Prefab,
    ProgressBar,
    resources,
    SpriteAtlas,
    tween,
    Vec3,
} from 'cc';
import { tilePrefab } from './prefab/tilePrefab';
import { graphicAnim } from './prefab/graphicAnim';
import { timer } from './timer';
const { ccclass, property } = _decorator;

export const TILE_SIZE = 105;
@ccclass('main')
export class main extends Component {
    @property(SpriteAtlas)
    spriteAtlas: SpriteAtlas = null;

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

    @property(Button)
    shuffleButton: Button = null;

    private matrixWidth: number = 0;
    private matrixHeight: number = 0;
    private matrixTiles: (tilePrefab | null)[][] = null;

    public curLevel: number = 1;
    private curLevelNode: Node = null;

    private victoryTmp: Node = null;
    private preTile: tilePrefab = null;

    private isConnect: boolean = true;

    protected onLoad(): void {
        this.loadLevel(this.curLevel);
    }

    loadLevel(index: number) {
        const name = `level-${index}`;
        resources.load(`data/${name}`, JsonAsset, (err, jsonAsset: any) => {
            if (err) {
                console.error(`Failed to load ${name}:`, err);
            } else {
                const childNode: Node = new Node(name);
                this.createMap(childNode, jsonAsset);
                this.node.addChild(childNode);
                this.levelAppearAnimation(childNode);
                this.curLevelNode = childNode;
            }
        });
    }

    levelAppearAnimation(node: Node) {
        node.scale = new Vec3(0.2, 0.2, 0.2);
        tween(node)
            .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'fade' })
            .start();
    }

    createMap(childNode: Node, jsonAsset: JsonAsset) {
        //Create Map
        const map = jsonAsset.json.data.map;
        this.matrixWidth = 0;
        this.matrixHeight = 0;
        map.forEach(item => {
            this.matrixWidth = Math.max(this.matrixWidth, item.x + 1);
            this.matrixHeight = Math.max(this.matrixHeight, item.y + 1);
        });

        //Init matrix of tiles
        this.matrixTiles = [];
        for (let i = 0; i < this.matrixWidth + 1; i++) {
            this.matrixTiles[i] = [];
            for (let j = 0; j < this.matrixHeight + 1; j++) {
                this.matrixTiles[i][j] = null;
            }
        }

        map.forEach((item, index) => {
            const comp = instantiate(this.tilePrefab).getComponent(tilePrefab);
            comp.posMatrixX = item.x;
            comp.posMatrixY = item.y;
            this.matrixTiles[item.x][item.y] = comp;

            //Set SpriteFrame
            const frame = this.spriteAtlas.getSpriteFrame(
                `episode-2-tile-${item.number}`
            );
            comp.setImage(frame);

            //Set Position
            comp.node.setPosition(this.convertMatixToVec3(item.x, item.y));

            //Set Function
            comp.init(index, () => {
                if (this.isConnect) {
                    this.connected(comp);
                } else {
                    this.unconnected(comp);
                }
            });

            //Show
            childNode.addChild(comp.node);
        });
    }

    connected(comp: tilePrefab) {
        this.preTile = comp;
        this.isConnect = false;
    }

    unconnected(comp: tilePrefab) {
        const isSimilar = this.preTile.compareTiles(comp);
        if (isSimilar) {
            const shortPath = this.shortestPath(
                [this.preTile.posMatrixX, this.preTile.posMatrixY],
                [comp.posMatrixX, comp.posMatrixY]
            );

            if (shortPath) {
                const starNodes: [node: Node, PosY: number][] = [];
                this.drawPath(shortPath);
                this.drawStar(shortPath, starNodes);

                //Sort and Animation
                starNodes.sort((a, b) => b[1] - a[1]);
                starNodes.forEach((star, index) => {
                    this.graphic
                        .getComponent(graphicAnim)
                        .starAnim(star[0], index);
                });

                //Remove from Matrix
                this.matrixTiles[this.preTile.posMatrixX][
                    this.preTile.posMatrixY
                ] = null;
                this.matrixTiles[comp.posMatrixX][comp.posMatrixY] = null;

                //Disable Path
                this.graphic.getComponent(graphicAnim).pathAnim();
                this.preTile.onDestroy();
                comp.onDestroy();

                this.isVictory(); //After destroy tiles, check if that are last tiles
            } else {
                this.preTile.onWrong();
                comp.onWrong();
            }

            this.preTile = null;
            this.isConnect = true;
        } else {
            this.preTile.onNormal();
            this.preTile = comp;
        }
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

    drawPath(shortPath: [number, number][]) {
        for (let i = 0; i < shortPath.length - 1; i++) {
            const [x0, y0] = shortPath[i];
            const [x1, y1] = shortPath[i + 1];
            const startPos = this.convertMatixToVec3(x0, y0);
            const endPos = this.convertMatixToVec3(x1, y1);
            this.drawLine(startPos, endPos);
        }
    }

    drawStar(shortPath: [number, number][], starNodes: [Node, number][]) {
        for (let i = 0; i < shortPath.length; i++) {
            const [x0, y0] = shortPath[i];
            const star = instantiate(this.starPrefab);
            star.setPosition(this.convertMatixToVec3(x0, y0));
            this.graphic.node.addChild(star);
            starNodes.push([star, y0]);
        }
    }

    shortestPath(
        start: [number, number],
        end: [number, number]
    ): [number, number][] | null {
        const matrix = this.matrixTiles;
        const rows = this.matrixWidth + 1;
        const cols = this.matrixHeight + 1;
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

    isVictory() {
        //Check if MatrixTiles empty
        const isEmpty = this.matrixTiles.every(row =>
            row.every(tile => tile == null)
        );

        if (isEmpty) {
            timer.isRunning = false;
            setTimeout(() => {
                this.victoryTmp = instantiate(this.victory);
                this.node.addChild(this.victoryTmp);
                this.curLevelNode.active = false;
            }, 1000);
            return true;
        } else {
            return false;
        }
    }

    reset() {
        this.curLevelNode.active = false;
        this.loadLevel(this.curLevel);
    }

    shuffleTiles() {
        if (this.matrixTiles) {
            this.shuffleButton.interactable = false;
            // Collect all non-null tiles and their positions
            const tiles: tilePrefab[] = [];
            const positions: { x: number; y: number }[] = [];

            for (let i = 0; i < this.matrixWidth + 1; i++) {
                for (let j = 0; j < this.matrixHeight + 1; j++) {
                    if (this.matrixTiles[i][j] !== null) {
                        tiles.push(this.matrixTiles[i][j]);
                        positions.push({ x: i, y: j });
                    }
                }
            }

            // Shuffle the tiles array using Fisher-Yates algorithm
            for (let i = tiles.length - 1; i > 0; i--) {
                const randomIndex = Math.floor(Math.random() * (i + 1));
                [tiles[i], tiles[randomIndex]] = [tiles[randomIndex], tiles[i]];
            }

            // Animate tiles to their new positions
            for (let i = 0; i < positions.length; i++) {
                const pos = positions[i];
                const tile = tiles[i];
                const newPosition = this.convertMatixToVec3(pos.x, pos.y);

                // Update matrix
                this.matrixTiles[pos.x][pos.y] = tile;

                // Update tile's matrix position
                tile.posMatrixX = pos.x;
                tile.posMatrixY = pos.y;

                // Animate to new position with tween
                tween(tile.node)
                    .to(0.5, { position: newPosition }, { easing: 'sineOut' })
                    .call(() => {
                        this.shuffleButton.interactable = true;
                    })
                    .start();
            }
        }
    }

    update(deltaTime: number) {}
}
