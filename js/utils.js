// Builds the board and return the created board
function buildBoard() {
  var size = gLevel.size;
  var board = [];
  for (var i = 0; i < size; i++) {
    board.push([]);
    for (var j = 0; j < size; j++) {
      board[i][j] = {
        minesAroundCount: '',
        isShown: false,
        isMine: false,
        isMarked: false,
      };
    }
  }
  return board;
}

// count mines around each cell and set the cell's minesAroundCount.
function setMinesNegsCount(board, rowIdx, colIdx) {
  var negCount = 0;
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i > board.length - 1) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j > board[0].length - 1) continue;
      if (i === rowIdx && j === colIdx) continue;
      var currCell = board[i][j];
      if (currCell.isMine) {
        negCount++;
      }
    }
  }
  return negCount ? negCount : '';
}

// Render the board as a <table> to the page
function renderBoard(board) {
  var strHTML = '';
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < board[i].length; j++) {
      var className = `cell cell-${i}-${j}`;
      strHTML += `<td class="${className}" oncontextmenu="cellMarked(this, ${i}, ${j});return false;" onclick="cellClicked(this, ${i}, ${j})"></td>`;
    }
    strHTML += '</tr>';
  }
  var elTbody = document.querySelector('tbody');
  elTbody.innerHTML = strHTML;
}

// Returns the class name for a specific cell
function getClassName(location) {
  var cellClass = 'cell-' + location.i + '-' + location.j;
  return cellClass;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
