import { Component, OnInit, AfterViewInit, ViewChild, signal, ChangeDetectorRef, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  
  ScannerQRCodeConfig,
  ScannerQRCodeResult,
  NgxScannerQrcodeComponent
} from 'ngx-scanner-qrcode';

@Component({
  selector: 'app-jogo',
  standalone: true,
  imports: [CommonModule, NgxScannerQrcodeComponent],
  templateUrl: './jogo.html',
  styleUrl: './jogo.scss'
})
export class JogoComponent implements OnInit, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID); // Proteção para SSR/Build

  @ViewChild('action') scanner!: NgxScannerQrcodeComponent;

  // Signals de Estado
  public isCameraActive = signal(false);
  public palavraSecreta = signal('GATO');
  public letrasDescobertas = signal<string[]>(['_', '_', '_', '_']);
  public vidas = signal(5);
  public letraErradaDetectada = signal(false);

  // Configuração otimizada para o Note 10+
  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        // 'environment' foca na câmera traseira principal
        facingMode: { ideal: 'environment' }
      }
    }
  };

  ngOnInit() {}

  ngAfterViewInit() {}

  public toggleCamera() {
    // Garante que o hardware só seja acessado no navegador
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.isCameraActive()) {
      this.scanner?.stop();
      this.isCameraActive.set(false);
    } else {
      this.isCameraActive.set(true);

      // Aumentamos o delay para 800ms. O Android 12 no Note 10+
      // precisa de tempo para instanciar o componente via *ngIf antes do start()
      setTimeout(() => {
        if (this.scanner) {
          this.scanner.start().subscribe({
            next: (res) => console.log('Câmera principal iniciada:', res),
            error: (err) => {
              console.warn('Falha ao abrir hardware:', err);
              // Fallback caso o navegador bloqueie o acesso
              this.isCameraActive.set(false);
            }
          });
        }
      }, 800);
    }
    this.cdr.detectChanges();
  }

  public handleEvent(e: ScannerQRCodeResult[]): void {
    // A biblioteca retorna um array; pegamos o primeiro resultado válido
    if (!e || e.length === 0) return;

    const valorRaw = e[0].value;
    if (valorRaw) {
      this.validarJogada(valorRaw.toString());
    }
  }

  private validarJogada(letraRaw: string) {
    // Normalização: Remove espaços, converte para maiúsculo e remove acentos
    const letra = letraRaw.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

    // Impede o processamento se não for uma letra única ou se já foi descoberta
    if (!letra || letra.length !== 1 || this.letrasDescobertas().includes(letra)) return;

    const palavra = this.palavraSecreta().toUpperCase();

    if (palavra.includes(letra)) {
      const novoProgresso = [...this.letrasDescobertas()];
      for (let i = 0; i < palavra.length; i++) {
        if (palavra[i] === letra) novoProgresso[i] = letra;
      }
      this.letrasDescobertas.set(novoProgresso);

      if (!novoProgresso.includes("_")) {
        // Vitória: Você pode emitir um som ou abrir um modal aqui
        console.log('Palavra completa!');
      }
    } else {
      // Lógica de erro
      this.vidas.update((v) => v - 1);
      this.letraErradaDetectada.set(true);

      // O Signal letraErradaDetectada dispara a animação do "X" no HTML
      setTimeout(() => this.letraErradaDetectada.set(false), 1500);

      if (this.vidas() <= 0) {
        console.log('Game Over');
      }
    }
  }
}
