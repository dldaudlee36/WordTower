import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import type { TileData, GridData } from '../types/game';

interface EngineConfig {
  container: HTMLElement;
  rows: number;
  cols: number;
  onWordSubmit: (selectedChars: string[], tileIds: string[]) => boolean;
}

export class PixiWordEngine {
  private app: Application;
  private container: HTMLElement;
  private rows: number;
  private cols: number;
  private tileSize: number = 65;
  private tileGap: number = 8;

  private boardContainer: Container;
  private lineGraphics: Graphics;
  private tileSprites: Map<string, { container: Container; text: Text; bg: Graphics }> = new Map();

  private selectedTiles: TileData[] = [];
  private isPointerDown: boolean = false;
  private onWordSubmit: (selectedChars: string[], tileIds: string[]) => boolean;
  private currentGrid: GridData = [];
  private currentHintTileId: string | null = null;

  constructor(config: EngineConfig) {
    this.container = config.container;
    this.rows = config.rows;
    this.cols = config.cols;
    this.onWordSubmit = config.onWordSubmit;
    this.app = new Application();
    this.boardContainer = new Container();
    this.lineGraphics = new Graphics();
  }

  public async init(initialGrid: GridData) {
    this.currentGrid = initialGrid;
    await this.app.init({
      resizeTo: this.container,
      backgroundColor: 0x0f172a,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.container.appendChild(this.app.canvas);
    this.app.stage.addChild(this.boardContainer);
    this.boardContainer.addChild(this.lineGraphics);

    this.calculateLayout();
    this.renderTiles();
    this.bindDragEvents();
  }

  private calculateLayout() {
    const totalWidth = this.cols * this.tileSize + (this.cols - 1) * this.tileGap;
    const totalHeight = this.rows * this.tileSize + (this.rows - 1) * this.tileGap;
    this.boardContainer.x = (this.app.screen.width - totalWidth) / 2;
    this.boardContainer.y = (this.app.screen.height - totalHeight) / 2;
  }

  private renderTiles() {
    const textStyle = new TextStyle({
      fontSize: 26,
      fill: '#f8fafc',
      fontWeight: 'bold',
      fontFamily: 'sans-serif',
    });

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.currentGrid[r][c];
        if (!tile) continue;

        const tileContainer = new Container();
        const x = c * (this.tileSize + this.tileGap);
        const y = r * (this.tileSize + this.tileGap);
        tileContainer.position.set(x, y);

        const bg = new Graphics();
        bg.roundRect(0, 0, this.tileSize, this.tileSize, 10);
        bg.fill(0x334155);

        const txt = new Text({ text: tile.char, style: textStyle });
        txt.anchor.set(0.5);
        txt.position.set(this.tileSize / 2, this.tileSize / 2);

        tileContainer.addChild(bg, txt);
        this.boardContainer.addChild(tileContainer);

        this.tileSprites.set(tile.id, { container: tileContainer, text: txt, bg });
      }
    }
  }

  private bindDragEvents() {
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    this.app.stage.on('pointerdown', (e) => {
      this.isPointerDown = true;
      this.handlePointerMove(e.global.x, e.global.y);
    });

    this.app.stage.on('pointermove', (e) => {
      if (!this.isPointerDown) return;
      this.handlePointerMove(e.global.x, e.global.y);
    });

    const endDrag = () => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;
      this.submitSelection();
    };

    this.app.stage.on('pointerup', endDrag);
    this.app.stage.on('pointerupoutside', endDrag);
  }

  private handlePointerMove(screenX: number, screenY: number) {
    const localX = screenX - this.boardContainer.x;
    const localY = screenY - this.boardContainer.y;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.currentGrid[r][c];
        if (!tile) continue;

        const tx = c * (this.tileSize + this.tileGap);
        const ty = r * (this.tileSize + this.tileGap);

        if (localX >= tx && localX <= tx + this.tileSize && localY >= ty && localY <= ty + this.tileSize) {
          this.trySelectTile(tile);
          return;
        }
      }
    }
  }

  private trySelectTile(tile: TileData) {
    if (this.selectedTiles.length > 0) {
      const last = this.selectedTiles[this.selectedTiles.length - 1];
      if (last.id === tile.id) return;

      if (this.selectedTiles.length > 1 && this.selectedTiles[this.selectedTiles.length - 2].id === tile.id) {
        const popped = this.selectedTiles.pop();
        if (popped) this.highlightTile(popped, false);
        this.redrawLines();
        return;
      }

      const dr = Math.abs(last.row - tile.row);
      const dc = Math.abs(last.col - tile.col);
      if (dr > 1 || dc > 1) return;

      if (this.selectedTiles.some((t) => t.id === tile.id)) return;
    }

    this.selectedTiles.push(tile);
    this.highlightTile(tile, true);
    this.redrawLines();
  }

  private highlightTile(tile: TileData, isSelected: boolean) {
    const sprite = this.tileSprites.get(tile.id);
    if (!sprite) return;
    sprite.bg.clear();
    sprite.bg.roundRect(0, 0, this.tileSize, this.tileSize, 10);
    sprite.bg.fill(isSelected ? 0x2563eb : 0x334155);
  }

  private redrawLines() {
    this.lineGraphics.clear();
    if (this.selectedTiles.length < 2) return;

    this.lineGraphics.setStrokeStyle({ width: 5, color: 0x60a5fa, alpha: 0.85 });
    this.selectedTiles.forEach((tile, index) => {
      const x = tile.col * (this.tileSize + this.tileGap) + this.tileSize / 2;
      const y = tile.row * (this.tileSize + this.tileGap) + this.tileSize / 2;
      if (index === 0) {
        this.lineGraphics.moveTo(x, y);
      } else {
        this.lineGraphics.lineTo(x, y);
      }
    });
    this.lineGraphics.stroke();
  }

  private submitSelection() {
    if (this.selectedTiles.length === 0) return;

    const chars = this.selectedTiles.map((t) => t.char);
    const ids = this.selectedTiles.map((t) => t.id);
    const isSuccess = this.onWordSubmit(chars, ids);

    if (isSuccess) {
      this.destroyMatchedTiles(ids);
    } else {
      this.selectedTiles.forEach((t) => this.highlightTile(t, false));
      this.selectedTiles = [];
      this.lineGraphics.clear();
    }
  }

  private destroyMatchedTiles(tileIds: string[]) {
    tileIds.forEach((id) => {
      const sprite = this.tileSprites.get(id);
      if (sprite) {
        gsap.to(sprite.container.scale, {
          x: 0,
          y: 0,
          duration: 0.2,
          onComplete: () => {
            this.boardContainer.removeChild(sprite.container);
            sprite.container.destroy({ children: true });
            this.tileSprites.delete(id);
          },
        });
      }

      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.currentGrid[r][c]?.id === id) {
            this.currentGrid[r][c] = null;
          }
        }
      }
    });

    this.selectedTiles = [];
    this.lineGraphics.clear();

    setTimeout(() => this.applyGravity(), 250);
  }

  public applyGravity() {
    for (let c = 0; c < this.cols; c++) {
      let targetRow = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        const tile = this.currentGrid[r][c];
        if (tile !== null) {
          if (targetRow !== r) {
            this.currentGrid[targetRow][c] = tile;
            this.currentGrid[r][c] = null;
            tile.row = targetRow;

            const sprite = this.tileSprites.get(tile.id);
            if (sprite) {
              const targetY = targetRow * (this.tileSize + this.tileGap);
              gsap.to(sprite.container.position, { y: targetY, duration: 0.35, ease: 'bounce.out' });
            }
          }
          targetRow--;
        }
      }
    }
  }

  /**
   * 힌트용 첫 글자 노란색 하이라이트 (플레이어 선택과 무관, 단순 시각 안내)
   */
  public showHint(firstChar: string): boolean {
    // 현재 판에서 해당 첫 글자를 가진 유효 타일 검색
    let targetTile: TileData | null = null;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.currentGrid[r][c];
        if (t && t.char === firstChar) {
          targetTile = t;
          break;
        }
      }
      if (targetTile) break;
    }

    if (!targetTile) return false;

    const sprite = this.tileSprites.get(targetTile.id);
    if (!sprite) return false;

    // 이전 힌트 복원
    if (this.currentHintTileId && this.currentHintTileId !== targetTile.id) {
      const prev = this.tileSprites.get(this.currentHintTileId);
      if (prev) {
        prev.bg.clear();
        prev.bg.roundRect(0, 0, this.tileSize, this.tileSize, 10);
        prev.bg.fill(0x334155);
      }
    }

    this.currentHintTileId = targetTile.id;

    // 노란색/골드 하이라이트 및 펄스 효과
    sprite.bg.clear();
    sprite.bg.roundRect(0, 0, this.tileSize, this.tileSize, 10);
    sprite.bg.fill(0xeab308); // 황금색

    gsap.fromTo(
      sprite.container.scale,
      { x: 1, y: 1 },
      { x: 1.15, y: 1.15, duration: 0.25, yoyo: true, repeat: 3 }
    );

    return true;
  }

  public destroy() {
    try {
      if (this.app && this.app.renderer) {
        this.app.destroy(true, { children: true });
      }
    } catch (e) {
      console.warn('Pixi destroy cleanup error:', e);
    }
  }
}