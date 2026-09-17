import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import gsap from 'gsap';
import type { TileData, GridData } from '../types/game';

interface EngineConfig {
  container: HTMLElement;
  rows: number;
  cols: number;
  onWordSubmit: (selectedChars: string[]) => boolean;
  onInvalidSubmit: () => void;
}

const ACTIVE_TEXT_STYLE = new TextStyle({
  fontSize: 28,
  fill: '#ffffff',
  fontWeight: '900',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  stroke: { color: '#0f172a', width: 2 },
});

const CLEARED_TEXT_STYLE = new TextStyle({
  fontSize: 26,
  fill: '#1e293b',
  fontWeight: 'bold',
  fontFamily: 'system-ui, -apple-system, sans-serif',
});

export class PixiWordEngine {
  private app: Application;
  private container: HTMLElement;
  private rows: number;
  private cols: number;

  private tileSize: number = 58;
  private tileGap: number = 16;

  private boardContainer: Container;
  private lineGraphics: Graphics;
  private tileSprites: Map<string, { container: Container; text: Text; bg: Graphics; baseX: number }> = new Map();

  private selectedTiles: TileData[] = [];
  private isPointerDown: boolean = false;
  private onWordSubmit: (selectedChars: string[]) => boolean;
  private onInvalidSubmit: () => void;
  private currentGrid: GridData = [];
  private clearedTileIds: Set<string> = new Set();

  private isDestroyed: boolean = false;

  constructor(config: EngineConfig) {
    this.container = config.container;
    this.rows = config.rows;
    this.cols = config.cols;
    this.onWordSubmit = config.onWordSubmit;
    this.onInvalidSubmit = config.onInvalidSubmit;
    this.app = new Application();
    this.boardContainer = new Container();
    this.lineGraphics = new Graphics();
  }

  public async init(initialGrid: GridData, initialClearedWords: string[]) {
    this.isDestroyed = false;
    this.currentGrid = initialGrid;
    this.clearedTileIds.clear();

    const clearedSet = new Set(initialClearedWords);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.currentGrid[r][c];
        if (tile && clearedSet.has(tile.word)) {
          this.clearedTileIds.add(tile.id);
        }
      }
    }

    await this.app.init({
      width: 360,
      height: 430,
      backgroundColor: 0x070b14,
      antialias: true,
      resolution: window.devicePixelRatio || 2,
      autoDensity: true,
    });

    if (this.isDestroyed) {
      try {
        this.app.destroy(true, { children: true });
      } catch (_) {}
      return;
    }

    if (this.container) {
      this.container.appendChild(this.app.canvas);
    }

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
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.currentGrid[r][c];
        if (!tile) continue;

        const tileContainer = new Container();
        const x = c * (this.tileSize + this.tileGap);
        const y = r * (this.tileSize + this.tileGap);
        tileContainer.position.set(x, y);

        const isCleared = this.clearedTileIds.has(tile.id);

        const bg = new Graphics();
        bg.roundRect(0, 0, this.tileSize, this.tileSize, 12);

        if (isCleared) {
          bg.fill({ color: 0x050811, alpha: 0.6 });
        } else {
          bg.fill({ color: 0x334155, alpha: 1 });
          bg.stroke({ width: 2, color: 0x64748b, alpha: 0.9 });
        }

        const txt = new Text({
          text: tile.char,
          style: isCleared ? CLEARED_TEXT_STYLE.clone() : ACTIVE_TEXT_STYLE.clone(),
        });
        txt.alpha = isCleared ? 0.3 : 1.0;
        txt.anchor.set(0.5);
        txt.position.set(this.tileSize / 2, this.tileSize / 2);

        tileContainer.addChild(bg, txt);
        this.boardContainer.addChild(tileContainer);

        this.tileSprites.set(tile.id, { container: tileContainer, text: txt, bg, baseX: x });
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
    const hitPadding = 4;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.currentGrid[r][c];
        if (!tile || this.clearedTileIds.has(tile.id)) continue;

        const tx = c * (this.tileSize + this.tileGap);
        const ty = r * (this.tileSize + this.tileGap);

        if (
          localX >= tx + hitPadding &&
          localX <= tx + this.tileSize - hitPadding &&
          localY >= ty + hitPadding &&
          localY <= ty + this.tileSize - hitPadding
        ) {
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
    sprite.bg.roundRect(0, 0, this.tileSize, this.tileSize, 12);

    if (isSelected) {
      sprite.bg.fill({ color: 0x2563eb, alpha: 1 });
      sprite.bg.stroke({ width: 2.5, color: 0x93c5fd });
    } else {
      sprite.bg.fill({ color: 0x334155, alpha: 1 });
      sprite.bg.stroke({ width: 2, color: 0x64748b, alpha: 0.9 });
    }
  }

  private redrawLines() {
    this.lineGraphics.clear();
    if (this.selectedTiles.length < 2) return;

    this.lineGraphics.setStrokeStyle({ width: 6, color: 0x38bdf8, alpha: 0.95 });
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
    const isSuccess = this.onWordSubmit(chars);

    if (isSuccess) {
      ids.forEach((id) => {
        this.clearedTileIds.add(id);
        const sprite = this.tileSprites.get(id);
        if (sprite) {
          sprite.bg.clear();
          sprite.bg.roundRect(0, 0, this.tileSize, this.tileSize, 12);
          sprite.bg.fill({ color: 0x050811, alpha: 0.6 });
          sprite.text.style = CLEARED_TEXT_STYLE.clone();
          sprite.text.alpha = 0.3;
          gsap.fromTo(sprite.container.scale, { x: 1.05, y: 1.05 }, { x: 1, y: 1, duration: 0.15 });
        }
      });
    } else {
      this.selectedTiles.forEach((t) => {
        const sprite = this.tileSprites.get(t.id);
        if (sprite) {
          gsap.killTweensOf(sprite.container);
          gsap.timeline()
            .to(sprite.container, { x: sprite.baseX + 5, duration: 0.04 })
            .to(sprite.container, { x: sprite.baseX - 5, duration: 0.04 })
            .to(sprite.container, { x: sprite.baseX + 4, duration: 0.04 })
            .to(sprite.container, { x: sprite.baseX, duration: 0.04, onComplete: () => {
              sprite.container.x = sprite.baseX;
            }});
          this.highlightTile(t, false);
        }
      });
      this.onInvalidSubmit();
    }

    this.selectedTiles = [];
    this.lineGraphics.clear();
  }

  public showHintForWord(targetWord: string, charIndex: number): boolean {
    let targetTile: TileData | null = null;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.currentGrid[r][c];
        if (
          t &&
          t.word === targetWord &&
          t.charIndex === charIndex &&
          !this.clearedTileIds.has(t.id)
        ) {
          targetTile = t;
          break;
        }
      }
      if (targetTile) break;
    }

    if (!targetTile) return false;
    const sprite = this.tileSprites.get(targetTile.id);
    if (!sprite) return false;

    sprite.bg.clear();
    sprite.bg.roundRect(0, 0, this.tileSize, this.tileSize, 12);
    sprite.bg.fill({ color: 0xeab308, alpha: 1 });
    sprite.bg.stroke({ width: 2.5, color: 0xfef08a });

    gsap.fromTo(
      sprite.container.scale,
      { x: 1, y: 1 },
      { x: 1.15, y: 1.15, duration: 0.2, yoyo: true, repeat: 3 }
    );
    return true;
  }

  public destroy() {
    this.isDestroyed = true;
    try {
      if (this.app && this.app.renderer) {
        this.app.destroy(true, { children: true });
      }
    } catch (e) {
      console.warn('Pixi cleanup warn:', e);
    }
  }
}
