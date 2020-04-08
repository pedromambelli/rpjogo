class Board {
  constructor(n_linhas = 28, n_colunas = 45, hex_radius = 15) {
    this.n_linhas = n_linhas;
    this.n_colunas = n_colunas;
    this.hex_radius = hex_radius;
    this.teams = [
      {
        name : "aliados",
        color : "#54C6BE"
      },
      {
        name : "inimigos",
        color : "#E5243F"
      },
      {
        name : "neutros",
        color : "#F7B15C"
      },
    ];
  }
}

module.exports = Board
