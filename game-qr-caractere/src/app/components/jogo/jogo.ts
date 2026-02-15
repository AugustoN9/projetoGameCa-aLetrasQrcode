import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  signal,
  ChangeDetectorRef,
  inject,
  PLATFORM_ID,
} from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import {
  ScannerQRCodeConfig,
  ScannerQRCodeResult,
  NgxScannerQrcodeComponent, // Versão 3.x utiliza o componente diretamente nos imports
} from "ngx-scanner-qrcode";

@Component({
  selector: "app-jogo",
  standalone: true,
  imports: [
    CommonModule,
    NgxScannerQrcodeComponent, // Importado como componente standalone
  ],
  templateUrl: "./jogo.html",
  styleUrl: "./jogo.scss",
})
export class JogoComponent implements OnInit, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID); // Proteção contra erros de SSR/Build no Vercel

  @ViewChild("action") scanner!: NgxScannerQrcodeComponent;

  // Estados reativos com Angular Signals
  public isCameraActive = signal(false);
  public palavraSecreta = signal("GATO");
  public letrasDescobertas = signal<string[]>(["_", "_", "_", "_"]);
  public vidas = signal(5);
  public letraErradaDetectada = signal(false);

  // Configuração otimizada para a câmera principal traseira
  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: { exact: "environment" }, // Foca na câmera traseira
      },
    },
  };

  ngOnInit() {}

  ngAfterViewInit() {}

  public toggleCamera() {
    // Garante que o código só execute no navegador (essencial para deploy Vercel)
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.isCameraActive()) {
      this.scanner?.stop();
      this.isCameraActive.set(false);
    } else {
      this.isCameraActive.set(true);

      // Aumentamos o delay para 1000ms para o Android 12 processar a permissão
      // e o Angular renderizar o scanner após o clique no botão
      setTimeout(() => {
        if (this.scanner) {
          this.scanner.start().subscribe({
            next: (res) => console.log("Hardware iniciado:", res),
            error: (err) => {
              console.error("Falha ao abrir câmera:", err);
              this.isCameraActive.set(false);
              alert(
                "Erro ao acessar a câmera. Verifique as permissões do navegador."
              );
            },
          });
        }
      }, 1000);
    }
    this.cdr.detectChanges();
  }

  // public handleEvent(e: ScannerQRCodeResult[]): void {
  //   if (!e || e.length === 0) return;

  //   const valorRaw = e[0].value;
  //   if (valorRaw) {
  //     this.validarJogada(valorRaw.toString());
  //   }
  // }

  public handleEvent(e: ScannerQRCodeResult[]): void {
    // Log fundamental para depuração no celular
    console.log("Evento de Scanner disparado:", e);

    if (!e || e.length === 0) return;

    // Algumas versões da biblioteca retornam o valor em e[0].value ou e[0].data
    const valorDetectado = e[0].value || (e[0] as any).data;

    if (valorDetectado) {
      console.log("Valor extraído com sucesso:", valorDetectado);
      this.validarJogada(valorDetectado.toString());

      // Feedback tátil (vibração) para confirmar a leitura no Note 10+
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    }
  }

  private validarJogada(letraRaw: string) {
    // Normalização para garantir que espaços ou acentos não quebrem a lógica
    const letra = letraRaw
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (
      !letra ||
      letra.length !== 1 ||
      this.letrasDescobertas().includes(letra)
    )
      return;

    const palavra = this.palavraSecreta().toUpperCase();

    if (palavra.includes(letra)) {
      const novoProgresso = [...this.letrasDescobertas()];
      for (let i = 0; i < palavra.length; i++) {
        if (palavra[i] === letra) novoProgresso[i] = letra;
      }
      this.letrasDescobertas.set(novoProgresso);

      if (!novoProgresso.includes("_")) {
        console.log("Vitória!"); // Aqui você pode chamar seu modal de sucesso
      }
    } else {
      this.vidas.update((v) => v - 1);
      this.letraErradaDetectada.set(true);

      // O overlay de erro (X) é controlado por este Signal
      setTimeout(() => this.letraErradaDetectada.set(false), 1500);

      if (this.vidas() <= 0) {
        console.log("Game Over");
      }
    }
  }
}
