import { Component, OnInit, AfterViewInit, ViewChild, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Essencial para o *ngIf
import {
  NgxScannerQrcodeModule,
  ScannerQRCodeConfig,
  ScannerQRCodeResult,
  NgxScannerQrcodeComponent
} from 'ngx-scanner-qrcode';

@Component({
  selector: 'app-jogo',
  standalone: true,
  imports: [CommonModule, NgxScannerQrcodeModule], // CommonModule declarado aqui
  templateUrl: './jogo.html',
  styleUrl: './jogo.scss'
})
export class JogoComponent implements OnInit, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('action') scanner!: NgxScannerQrcodeComponent;

  // Signals de Estado
  public isCameraActive = signal(false);
  public palavraSecreta = signal('GATO');
  public letrasDescobertas = signal<string[]>(['_', '_', '_', '_']);
  public vidas = signal(5);
  public letraErradaDetectada = signal(false);

  // Configuração para o Note 10+
  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: { exact: 'environment' }
      }
    }
  };

  ngOnInit() {}
  ngAfterViewInit() {}

  public toggleCamera() {
    if (this.isCameraActive()) {
      this.scanner?.stop();
      this.isCameraActive.set(false);
    } else {
      this.isCameraActive.set(true);
      setTimeout(() => {
        if (this.scanner) {
          this.scanner.start().subscribe({
            next: (res) => console.log('Câmera iniciada:', res),
            error: (err) => {
              console.warn('Erro modo exact, tentando flexível', err);
              this.config = { ...this.config, constraints: { video: { facingMode: 'environment' } } };
              this.scanner.start();
            }
          });
        }
      }, 400);
    }
    this.cdr.detectChanges();
  }

  public handleEvent(e: ScannerQRCodeResult[]): void {
    if (!e || e.length === 0) return;

    const valorRaw = e[0].value;
    if (valorRaw) {
      this.validarJogada(valorRaw.toString());
    }
  }

  private validarJogada(letraRaw: string) {
    const letra = letraRaw.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

    if (!letra || letra.length !== 1 || this.letrasDescobertas().includes(letra)) return;

    const palavra = this.palavraSecreta().toUpperCase();

    if (palavra.includes(letra)) {
      const novoProgresso = [...this.letrasDescobertas()];
      for (let i = 0; i < palavra.length; i++) {
        if (palavra[i] === letra) novoProgresso[i] = letra;
      }
      this.letrasDescobertas.set(novoProgresso);

      if (!novoProgresso.includes("_")) {
        alert('Parabéns! Você descobriu a palavra!');
      }
    } else {
      this.vidas.update((v) => v - 1);
      this.letraErradaDetectada.set(true);
      setTimeout(() => this.letraErradaDetectada.set(false), 1500);

      if (this.vidas() <= 0) {
        alert('Fim de jogo! Tente novamente.');
      }
    }
  }
}
