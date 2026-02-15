import {
  Component,
  input,
  output,
  signal,
  OnInit,
  ViewChild,
  AfterViewInit,
  PLATFORM_ID,
  inject,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import {
  NgxScannerQrcodeComponent,
  ScannerQRCodeResult,
  ScannerQRCodeConfig,
} from "ngx-scanner-qrcode";

@Component({
  selector: "app-jogo",
  standalone: true,
  imports: [CommonModule, NgxScannerQrcodeComponent],
  templateUrl: "./jogo.html",
  styleUrl: "./jogo.scss",
})
export class JogoComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild("action") scanner!: NgxScannerQrcodeComponent;

  palavraSecreta = input.required<string>();
  onSair = output<void>();

  vidas = signal(5);
  letrasDescobertas = signal<string[]>([]);
  jogoFinalizado = signal(false);
  letraErradaDetectada = signal(false);
  isBrowser = signal(false);
  isCameraActive = signal(false); // Controla se o scanner foi ligado pelo botão

  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: { ideal: 1280 }, // Aumentamos a resolução para maior clareza
        height: { ideal: 720 },
        facingMode: { exact: "environment" },
      },
    },
    canvasStyles: [
      { lineWidth: 1, strokeStyle: "#ffff00", fillStyle: "#ffff00" }, // Borda amarela no código lido
    ],
  };

  ngOnInit() {
    this.isBrowser.set(isPlatformBrowser(this.platformId));
    this.inicializarTabuleiro();
  }

  ngAfterViewInit() {
    // Força o Angular a reconhecer o ViewChild sem disparar o erro de injeção imediata
    this.cdr.detectChanges();
  }

  private inicializarTabuleiro() {
    const slots = Array(this.palavraSecreta().length).fill("_");
    this.letrasDescobertas.set(slots);
  }

  public toggleCamera() {
    if (this.isCameraActive()) {
      this.scanner?.stop();
      this.isCameraActive.set(false);
    } else {
      this.isCameraActive.set(true);

      setTimeout(() => {
        if (this.scanner) {
          this.scanner.start().subscribe({
            next: () => console.log("Câmera traseira iniciada"),
            error: (err) => {
              console.warn("Erro no modo exact, tentando modo flexível", err);

              // Correção para o VS Code: Reinicializamos o objeto de forma segura
              this.config = {
                ...this.config,
                constraints: {
                  ...this.config.constraints,
                  video: {
                    width: { ideal: 480 },
                    facingMode: "environment", // Fallback flexível
                  },
                },
              };

              this.scanner.start();
            },
          });
        }
      }, 300);
    }
    this.cdr.detectChanges();
  }

  public handleEvent(event: ScannerQRCodeResult[]): void {
    if (!event?.length || this.jogoFinalizado() || this.letraErradaDetectada())
      return;

    const valorLido = event[0].value?.toUpperCase().trim();
    if (valorLido && valorLido.length === 1) {
      this.validarJogada(valorLido);
    }
  }

  private validarJogada(letraRaw: string) {
    // 1. Normalização: remove espaços e garante que seja apenas a letra pura
    const letra = letraRaw
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Impede processamento se não for uma letra válida ou se já foi descoberta
    if (
      !letra ||
      letra.length !== 1 ||
      this.letrasDescobertas().includes(letra)
    )
      return;

    const palavra = this.palavraSecreta()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (palavra.includes(letra)) {
      const novoProgresso = [...this.letrasDescobertas()];
      let houveAcerto = false;

      for (let i = 0; i < palavra.length; i++) {
        if (palavra[i] === letra) {
          novoProgresso[i] = letra;
          houveAcerto = true;
        }
      }

      if (houveAcerto) {
        this.letrasDescobertas.set(novoProgresso);

        // Checa vitória
        if (!novoProgresso.includes("_")) {
          this.encerrar();
        }
      }
    } else {
      // Só penaliza se a letra já não foi tentada como errada (opcional)
      this.vidas.update((v) => v - 1);
      this.letraErradaDetectada.set(true);

      // O som de erro ou vibração poderia entrar aqui
      setTimeout(() => this.letraErradaDetectada.set(false), 1500);

      if (this.vidas() <= 0) {
        this.encerrar();
      }
    }
  }

  private encerrar() {
    this.jogoFinalizado.set(true);
    if (this.scanner) {
      this.scanner.stop();
      this.isCameraActive.set(false);
    }
  }

  public reiniciar() {
    this.vidas.set(5);
    this.inicializarTabuleiro();
    this.jogoFinalizado.set(false);
    this.isCameraActive.set(false);
    this.cdr.detectChanges();
  }
}
