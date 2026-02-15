import { Component, input, output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-admin",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./admin.html",
  styleUrl: "./admin.scss",
})
export class AdminComponent {
  // Recebe o estado atual ('login' ou 'config') vindo do App
  estado = input.required<"home" | "login" | "config" | "jogo">();

  // Eventos para comunicar com o app.ts
  onSalvar = output<string>();
  onVoltar = output<void>();
  onLoginSucesso = output<"config">();

  // Estado interno
  senhaDigitada = signal("");
  loginError = signal(false);

  public verificarSenha() {
    // Senha simples para teste conforme planejado
    if (this.senhaDigitada() === "123") {
      this.loginError.set(false);
      this.onLoginSucesso.emit("config");
    } else {
      this.loginError.set(true);
    }
  }

  public salvar(palavra: string) {
    if (palavra.trim().length >= 2) {
      this.onSalvar.emit(palavra.toUpperCase());
    }
  }
}
