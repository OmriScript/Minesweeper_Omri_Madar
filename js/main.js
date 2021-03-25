'use strict';

// Icons
const MINE = '💣';
const FLAG = '🚩';
const LIFE = '♥';
const SMILEY_IN_GAME = '😀';
const SMILEY_GAME_OVER = '😭';
const SMILEY_WIN = '😎';
const HINT = '💡';

var gClueIsActive = false;
var gElCurrClueClass = '';

// Model
var gBoard;
var gInterval;

var gLevel = {
  size: 4,
  mines: 2,
  lives: 2,
};

var gGame = {
  isOn: false,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
  minsPassed: 0,
};

function initGame() {
  gBoard = buildBoard();
  renderBoard(gBoard);
  resetSettings();
}

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
  return negCount;
}

// Render the board as a <table> to the page
function renderBoard(board) {
  var strHTML = '';
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < board[i].length; j++) {
      var currCell = board[i][j];
      var currCellContent = getCellContent(currCell);
      var className = `cell cell-${i}-${j}`;
      strHTML += `<td class="${className}" oncontextmenu="cellMarked(this, ${i}, ${j});return false;" onclick="cellClicked(this, ${i}, ${j})"></td>`;
      // ${currCellContent} deleted above. return it to discover the board
    }
    strHTML += '</tr>';
  }

  var elTbody = document.querySelector('tbody');
  elTbody.innerHTML = strHTML;
}

function getCellContent(cell) {
  if (!cell.isShown && cell.isMarked) {
    return FLAG;
  } else if (cell.isMine) {
    return MINE;
  } else {
    return cell.minesAroundCount;
  }
}

// called when a cell (td) is clicked
function cellClicked(elCell, i, j) {
  // first click in the game
  if (!gGame.secsPassed && gGame.isOn) {
    gGame.secsPassed = 1;
    gInterval = setInterval(startTimer, 1000);
    var cellClickedClass = getClassName({ i: i, j: j });

    // Set mines at random locations
    // set model mines
    for (var k = 0; k < gLevel.mines; k++) {
      var randomI = getRandomInt(0, gBoard.length);
      var randomJ = getRandomInt(0, gBoard.length);
      var randomCell = gBoard[randomI][randomJ];
      var randomCellClass = getClassName({ i: randomI, j: randomJ });
      if (!randomCell.isMine && randomCellClass !== cellClickedClass) {
        randomCell.isMine = true;
      } else {
        k--;
      }
    }
    // set model minesAroundCount
    // if goes back to i and j, they overrides the i&j parameters
    for (var a = 0; a < gBoard.length; a++) {
      for (var b = 0; b < gBoard.length; b++) {
        var currCell = gBoard[a][b];
        currCell.minesAroundCount = setMinesNegsCount(gBoard, a, b);
      }
    }
    if (gClueIsActive) {
      console.log('gBoard', gBoard);
      cellClickedAfterClue(gBoard, i, j);
      return;
    }
    // end of first game click
  }

  var cell = gBoard[i][j];

  if (cell.isShown) return;
  if (!gGame.isOn) return;
  if (cell.isMarked) return;
  if (!gLevel.lives) return;

  if (gClueIsActive) {
    cellClickedAfterClue(gBoard, i, j);
    return;
  }

  cell.isShown = true;

  if (!cell.isMine) {
    // update dom
    elCell.classList.add('clicked');
  }
  // if mine clicked
  if (cell.isMine) {
    gLevel.lives--;
    stepMineAnimation();

    // if have lives left
    if (gLevel.lives > 0) {
      // update model
      cell.isShown = true;

      // update dom
      renderLives();
      elCell.innerHTML = MINE;
      elCell.classList.add('clicked');
    } else {
      // 0 lives left
      renderLives();
      gGame.isOn = false;
      clearInterval(gInterval);
      elCell.classList.add('mine-clicked');

      // game over & show all mines
      renderSmiley('GameOver');
      for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
          var currCell = gBoard[i][j];
          if (currCell.isMine) {
            // update model
            currCell.isShown = true;
            // update dom
            var classCurrCell = getClassName({ i: `${i}`, j: `${j}` });
            var elCurrCell = document.querySelector(`.${classCurrCell}`);
            elCurrCell.innerHTML = MINE;
            if (elCurrCell !== elCell) {
              elCurrCell.classList.add('clicked');
            }
          }
        }
      }
    }
  } else if (cell.minesAroundCount) {
    // num cell clicked

    elCell.innerHTML = cell.minesAroundCount;
    gGame.shownCount++;
    checkGameOver();

    // empty cell clicked
  } else if (!cell.minesAroundCount) {
    gGame.shownCount++;
    checkGameOver();
    expandShown(gBoard, elCell, i, j);
  }
}

// Called on right click to mark a cell (suspected to be a mine)
function cellMarked(elCell, i, j) {
  var cell = gBoard[i][j];
  if (cell.isShown || !gGame.isOn) return;
  if (cell.isMarked) {
    // update model
    cell.isMarked = false;
    // update dom
    elCell.innerHTML = '';
    gGame.markedCount--;
    return;
  }

  // update model
  cell.isMarked = true;
  // update dom
  elCell.innerHTML = FLAG;
  gGame.markedCount++;
}

// Game ends when all mines are marked, and all the other cells are shown
function checkGameOver() {
  var emptyCells = gLevel.size * gLevel.size - gLevel.mines;
  if (emptyCells === gGame.shownCount) {
    renderSmiley('Victory');
    gGame.isOn = false;
    clearInterval(gInterval);
  }
}

// When user clicks a cell with no mines around, we need to open not only that cell, but also its neighbors.
// NOTE: start with a basic implementation that only opens the non-mine 1st degree neighbors
function expandShown(board, elCell, rowIdx, colIdx) {
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i > board.length - 1) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j > board[0].length - 1) continue;
      if (i === rowIdx && j === colIdx) continue;
      var currCell = board[i][j];
      var currCellClass = getClassName({ i: i, j: j });
      var elCurrCell = document.querySelector(`.${currCellClass}`);

      if (currCell.isMine || currCell.isMarked) {
        continue;
      } else if (currCell.minesAroundCount) {
        if (currCell.isShown) return;
        currCell.isShown = true;
        elCurrCell.innerHTML = currCell.minesAroundCount;
        elCurrCell.classList.add('clicked');

        gGame.shownCount++;
        checkGameOver();
      } else {
        // another empty cell
        // continue bonus and deleted repeated login. maybe recursive?

        if (currCell.isShown) return;
        currCell.isShown = true;
        elCurrCell.classList.add('clicked');
        gGame.shownCount++;
        checkGameOver();
      }
    }
  }
}

// Returns the class name for a specific cell
function getClassName(location) {
  // from {1:2 , j:6} to cell-2-6
  var cellClass = 'cell-' + location.i + '-' + location.j;
  return cellClass;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function startTimer() {
  var elTimer = document.querySelector('.timer');
  var secs = gGame.secsPassed;
  var mins = gGame.minsPassed;
  if (secs === 0 && mins === 0) {
    elTimer.innerHTML = '00:00';
  }

  gGame.secsPassed++;
  var timeStr = '';
  var minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  var secsStr = secs < 10 ? `:0${secs}` : `:${secs}`;

  if (secs < 59) {
    timeStr += minsStr + secsStr;
  } else {
    gGame.minsPassed++;
    gGame.secsPassed = 0;
    timeStr += minsStr + secsStr;
  }
  elTimer.innerHTML = timeStr;
}

function chooseLvl(size, mines, lives) {
  gLevel.size = size;
  gLevel.mines = mines;
  gLevel.lives = lives;
  initGame();
}

function resetSettings() {
  var elTimer = document.querySelector('.timer');
  elTimer.innerHTML = '00:00';
  renderSmiley('Reset');
  gGame.secsPassed = 0;
  gGame.minsPassed = 0;
  gGame.markedCount = 0;
  gGame.shownCount = 0;
  gLevel.lives = gBoard.length === 4 ? 2 : 3;
  clearInterval(gInterval);
  gGame.isOn = true;
  renderLives();
  gClueIsActive = false;
  gElCurrClueClass = '';
}

function renderSmiley(gameState) {
  var elSmiley = document.querySelector('.game-smiley');
  // gameState;
  elSmiley.innerHTML =
    gameState === 'GameOver'
      ? SMILEY_GAME_OVER
      : gameState === 'Victory'
      ? SMILEY_WIN
      : SMILEY_IN_GAME;
}

function renderLives() {
  var strHTML = '';
  var elLives = document.querySelector('div .game-lives');
  var lives = gLevel.lives;
  if (!lives) {
    strHTML += 'Game Over'; // TODO: if localStorage, change to best time;
  } else {
    for (var i = 0; i < lives; i++) {
      strHTML += LIFE;
    }
  }
  elLives.innerHTML = strHTML;
}

function stepMineAnimation() {
  var redInterval = setTimeout(function () {
    document.querySelector('table').style.backgroundColor = `rgb(245, 80, 80)`;
    // clearInterval(regularInterval);
  }, 100);
  var regularInterval = setTimeout(function () {
    document.querySelector('table').style.backgroundColor = 'white';
    clearInterval(redInterval);
  }, 200);
  // clearInterval(redInterval);
}

// incomplete bonus below
function activateClue(elClue) {
  gClueIsActive = true;
  gElCurrClueClass = document.querySelector(`.${elClue.classList[0]}`);
  gElCurrClueClass.style.borderRadius = '50%';
  gElCurrClueClass.style.border = '3px solid rgb(248, 248, 209)';
}

function cellClickedAfterClue(gBoard, rowIdx, colIdx) {
  if (gBoard[rowIdx][colIdx].isShown) return;
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j > gBoard[0].length - 1) continue;
      var currCell = gBoard[i][j];

      // update model
      currCell.isShown = true;
      // update dom
      var currCellClass = getClassName({ i: i, j: j });
      var elCurrCell = document.querySelector(`.${currCellClass}`);
      elCurrCell.innerHTML = currCell.isMine ? MINE : currCell.minesAroundCount;

      // continue here the bonus
      setTimeout(function () {
        elCurrCell.innerHTML = '';
      }, 1000);

      console.log(elCurrCell, 'elCurrCell');
    }
  }

  gElCurrClueClass.style.visibility = 'hidden';
  gClueIsActive = false;
}
