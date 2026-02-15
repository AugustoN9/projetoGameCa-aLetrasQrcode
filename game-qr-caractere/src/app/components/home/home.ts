import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  // Emissor de evento para trocar de tela no app.ts
  onNavegar = output<'login' | 'jogo'>();

  public selecionarPerfil(perfil: 'login' | 'jogo') {
    this.onNavegar.emit(perfil);
  }
}
