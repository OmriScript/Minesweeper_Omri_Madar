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
var gInterval;

// Model
var gBoard;
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

// called when a cell (td) is clicked
function cellClicked(elCell, i, j) {
  // first click in the game
  if (!gGame.secsPassed && gGame.isOn) {
    gGame.secsPassed = 1;
    gInterval = setInterval(startTimer, 1000);
    var cellClickedClass = getClassName({ i: i, j: j });

    // set model mines at random locations
    for (var k = 0; k < gLevel.mines; k++) {
      var randomI = getRandomInt(0, gBoard.length);
      var randomJ = getRandomInt(0, gBoard.length);
      var randomCell = gBoard[randomI][randomJ];
      var randomCellClass = getClassName({ i: randomI, j: randomJ });
      if (!randomCell.isMine && randomCellClass !== cellClickedClass) {
        // cell-2-4
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
      cellClickedAfterClue(gBoard, i, j);
      return;
    }
  } // end of first game click

  var cell = gBoard[i][j];
  if (cell.isShown || cell.isMarked || !gGame.isOn || !gLevel.lives) return;
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
      // make sad smiley for .5 sec
      renderSmiley('GameOver');
      setTimeout(function () {
        renderSmiley('Reset');
      }, 500);
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
    gGame.markedCount--;
    // update dom
    elCell.innerHTML = '';
  } else {
    // update model
    cell.isMarked = true;
    gGame.markedCount++;
    // update dom
    elCell.innerHTML = FLAG;
  }
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
function expandShown(board, elCell, rowIdx, colIdx) {
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i > board.length - 1) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j > board[0].length - 1) continue;
      if (i === rowIdx && j === colIdx) continue;
      var currCell = board[i][j];
      var currCellClass = getClassName({ i: i, j: j });
      var elCurrCell = document.querySelector(`.${currCellClass}`);
      // if not a number cell
      if (currCell.isMine || currCell.isMarked) {
        continue;
        // number cell
      } else if (currCell.minesAroundCount) {
        if (currCell.isShown) return;
        elCurrCell.innerHTML = currCell.minesAroundCount;
      }
      currCell.isShown = true;
      elCurrCell.classList.add('clicked');
      gGame.shownCount++;
      checkGameOver();
    }
  }
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
  resetClues();
}

function renderSmiley(gameState) {
  var elSmiley = document.querySelector('.game-smiley');
  elSmiley.innerHTML =
    gameState === 'GameOver'
      ? SMILEY_GAME_OVER
      : gameState === 'Victory'
      ? SMILEY_WIN
      : SMILEY_IN_GAME;
}

function renderLives() {
  var strHTML = '';
  var elLives = document.querySelector('.game-lives');
  var lives = gLevel.lives;
  if (!lives) {
    strHTML += 'Game Over';
  } else {
    for (var i = 0; i < lives; i++) {
      strHTML += LIFE + ' ';
    }
  }
  elLives.innerHTML = strHTML;
}

function stepMineAnimation() {
  var redInterval = setTimeout(function () {
    document.querySelector('table').style.backgroundColor = `rgb(245, 80, 80)`;
  }, 100);
  setTimeout(function () {
    document.querySelector('table').style.backgroundColor = 'white';
    clearInterval(redInterval);
  }, 200);
}

function activateClue(elClue) {
  gClueIsActive = true;
  gElCurrClueClass = document.querySelector(`.${elClue.classList[1]}`);
  gElCurrClueClass.style.borderRadius = '50%';
  gElCurrClueClass.style.border = '3px solid rgb(248, 248, 209)';
}

function cellClickedAfterClue(gBoard, rowIdx, colIdx) {
  var cellCoordsClue = [];
  if (gBoard[rowIdx][colIdx].isShown) return;
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j > gBoard[0].length - 1) continue;
      var currCell = gBoard[i][j];
      if (currCell.isShown) continue;
      cellCoordsClue.push({ i: i, j: j });
      var currCellClass = getClassName({ i: i, j: j });
      var elCurrCell = document.querySelector(`.${currCellClass}`);
      elCurrCell.innerHTML = currCell.isMine ? MINE : currCell.minesAroundCount;
    }
  }

  // unreveal cells shown by hint
  setTimeout(function () {
    for (var i = 0; i < cellCoordsClue.length; i++) {
      var currCell = gBoard[cellCoordsClue[i].i][cellCoordsClue[i].j];
      var elCurrCellClass = getClassName({
        i: cellCoordsClue[i].i,
        j: cellCoordsClue[i].j,
      });
      var elCurrCell = document.querySelector(`.${elCurrCellClass}`);
      elCurrCell.innerHTML = currCell.isMarked ? FLAG : '';
    }
  }, 1000);

  gElCurrClueClass.style.visibility = 'hidden';
  gClueIsActive = false;
}

function resetClues() {
  var clues = document.querySelectorAll('.clue');
  for (var i = 0; i < clues.length; i++) {
    clues[i].style.visibility = 'visible';
    clues[i].style.border = '3px solid white';
  }
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
