import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importe seus novos componentes aqui
import { HomeComponent } from './components/home/home';
import { AdminComponent } from './components/admin/admin';
import { JogoComponent } from './components/jogo/jogo';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, HomeComponent, AdminComponent, JogoComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  telaAtual = signal<'home' | 'login' | 'config' | 'jogo'>('home');
  palavraSecreta = signal('COELHO');

  irPara(tela: any) {
    this.telaAtual.set(tela);
  }

  configurarPalavra(nova: string) {
    this.palavraSecreta.set(nova.toUpperCase());
    this.irPara('home');
  }
}
