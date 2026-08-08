import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
})
export class QrCodeComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) value!: string;
  @Input() size = 128;

  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['value'] || changes['size']) && this.viewReady) {
      this.render();
    }
  }

  private render(): void {
    if (!this.value) {
      return;
    }

    QRCode.toCanvas(this.canvasRef.nativeElement, this.value, {
      width: this.size,
      margin: 1,
    }).catch(() => {
      // Nothing to fall back to visually; the canvas just stays blank.
    });
  }
}
