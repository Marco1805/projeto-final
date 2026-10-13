const CHAVE = 'stand_favoritos';

export function obterFavoritos() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || '[]');
  } catch {
    return [];
  }
}

export function eFavorito(id) {
  return obterFavoritos().includes(id);
}

export function alternarFavorito(id) {
  const favoritos = obterFavoritos();
  const indice = favoritos.indexOf(id);
  if (indice === -1) {
    favoritos.push(id);
  } else {
    favoritos.splice(indice, 1);
  }
  try {
    localStorage.setItem(CHAVE, JSON.stringify(favoritos.slice(-100)));
  } catch { /* Espaço esgotado */ }
  return indice === -1; // true se adicionou, false se removeu
}

export function svgCoracao(ativo) {
  return `<svg viewBox="0 0 24 24" fill="${ativo ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}
