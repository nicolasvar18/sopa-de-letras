
(function (document, $, wordfind) {

  'use strict';

  var WordFindGame = function() {

    // Lista de palabras
    var wordList;

    var drawPuzzle = function (el, puzzle) {
      
      var output = '';
      // Para cada fila de la sopa de letras
      for (var i = 0, height = puzzle.length; i < height; i++) {
        // Agregar un div para representar una fila en la sopa de letras
        var row = puzzle[i];
        output += '<div>';
        // Para cada elemento de esa fila
        for (var j = 0, width = row.length; j < width; j++) {
            // Agregue nuestro botón con la clase apropiada
            output += '<button class="puzzleSquare" x="' + j + '" y="' + i + '">';
            output += row[j] || '&nbsp;';
            output += '</button>';
        }
        // cierra nuestro div que representa una fila
        output += '</div>';
      }

      $(el).html(output);
    };

    var drawWords = function (el, words) {
      
      var output = '<ul>';
      for (var i = 0, len = words.length; i < len; i++) {
        var word = words[i];
        output += '<li class="word ' + word + '">' + word;
      }
      output += '</ul>';

      $(el).html(output);
    };


    var startSquare, selectedSquares = [], curOrientation, curWord = '';

    /**
    * Evento que maneja el mouse hacia abajo en un nuevo cuadrado. 
    * Inicializa el estado del juego
    */
    var startTurn = function () {
      $(this).addClass('selected');
      startSquare = this;
      selectedSquares.push(this);
      curWord = $(this).text();
    };


    var select = function (target) {
      // Si el usuario aún no ha comenzado una palabra, simplemente regrese
      if (!startSquare) {
        return;
      }

      // Si el nuevo cuadrado es en realidad el cuadrado anterior, simplemente regrese
      var lastSquare = selectedSquares[selectedSquares.length-1];
      if (lastSquare == target) {
        return;
      }

      var backTo;
      for (var i = 0, len = selectedSquares.length; i < len; i++) {
        if (selectedSquares[i] == target) {
          backTo = i+1;
          break;
        }
      }

      while (backTo < selectedSquares.length) {
        $(selectedSquares[selectedSquares.length-1]).removeClass('selected');
        selectedSquares.splice(backTo,1);
        curWord = curWord.substr(0, curWord.length-1);
      }

      var newOrientation = calcOrientation(
          $(startSquare).attr('x')-0,
          $(startSquare).attr('y')-0,
          $(target).attr('x')-0,
          $(target).attr('y')-0
          );

      if (newOrientation) {
        selectedSquares = [startSquare];
        curWord = $(startSquare).text();
        if (lastSquare !== startSquare) {
          $(lastSquare).removeClass('selected');
          lastSquare = startSquare;
        }
        curOrientation = newOrientation;
      }

      var orientation = calcOrientation(
          $(lastSquare).attr('x')-0,
          $(lastSquare).attr('y')-0,
          $(target).attr('x')-0,
          $(target).attr('y')-0
          );

      if (!orientation) {
        return;
      }

      if (!curOrientation || curOrientation === orientation) {
        curOrientation = orientation;
        playTurn(target);
      }

    };
    
    var touchMove = function(e) {
      var xPos = e.originalEvent.touches[0].pageX;
      var yPos = e.originalEvent.touches[0].pageY;
      var targetElement = document.elementFromPoint(xPos, yPos);
      select(targetElement)
    };
    
    var mouseMove = function() { 
      select(this);
    };

    var playTurn = function (square) {

      // make sure we are still forming a valid word
      for (var i = 0, len = wordList.length; i < len; i++) {
        if (wordList[i].indexOf(curWord + $(square).text()) === 0) {
          $(square).addClass('selected');
          selectedSquares.push(square);
          curWord += $(square).text();
          break;
        }
      }
    };

    var endTurn = function () {

      // Mira si formamos una palabra válida
      for (var i = 0, len = wordList.length; i < len; i++) {
        
        if (wordList[i] === curWord) {
          $('.selected').addClass('found');
          wordList.splice(i,1);
          $('.' + curWord).addClass('wordFound');
        }

        if (wordList.length === 0) {
          $('.puzzleSquare').addClass('complete');
        }
      }

      // Restablece
      $('.selected').removeClass('selected');
      startSquare = null;
      selectedSquares = [];
      curWord = '';
      curOrientation = null;
    };

    var calcOrientation = function (x1, y1, x2, y2) {

      for (var orientation in wordfind.orientations) {
        var nextFn = wordfind.orientations[orientation];
        var nextPos = nextFn(x1, y1, 1);

        if (nextPos.x === x2 && nextPos.y === y2) {
          return orientation;
        }
      }

      return null;
    };

    return {

      create: function(words, puzzleEl, wordsEl, options) {
        
        wordList = words.slice(0).sort();

        var puzzle = wordfind.newPuzzle(words, options);

        // Saca todas las palabras
        drawPuzzle(puzzleEl, puzzle);
        drawWords(wordsEl, wordList);

        // adjunta los eventos a los botones
        if (window.navigator.msPointerEnabled) {
          $('.puzzleSquare').on('MSPointerDown', startTurn);
          $('.puzzleSquare').on('MSPointerOver', select);
          $('.puzzleSquare').on('MSPointerUp', endTurn);
        }
        else {
          $('.puzzleSquare').mousedown(startTurn);
          $('.puzzleSquare').mouseenter(mouseMove);
          $('.puzzleSquare').mouseup(endTurn);
          $('.puzzleSquare').on("touchstart", startTurn);
          $('.puzzleSquare').on("touchmove", touchMove);
          $('.puzzleSquare').on("touchend", endTurn);
        }

        return puzzle;
      },

      solve: function(puzzle, words) {

        var solution = wordfind.solve(puzzle, words).found;

        for( var i = 0, len = solution.length; i < len; i++) {
          var word = solution[i].word,
              orientation = solution[i].orientation,
              x = solution[i].x,
              y = solution[i].y,
              next = wordfind.orientations[orientation];

          if (!$('.' + word).hasClass('wordFound')) {
            for (var j = 0, size = word.length; j < size; j++) {
              var nextPos = next(x, y, j);
              $('[x="' + nextPos.x + '"][y="' + nextPos.y + '"]').addClass('solved');
            }

            $('.' + word).addClass('wordFound');
          }
        }

      }
    };
  };


  /**
  * Permite que el juego se use dentro del navegador
  */
  window.wordfindgame = WordFindGame();

}(document, jQuery, wordfind));