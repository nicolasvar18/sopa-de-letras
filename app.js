(function () {

  'use strict';

  /**
  * Inicia el objeto.
  */
  var WordFind = function () {

    // Letras que se usan para llenar los espacios en blanco
    var letters = 'abcdefghijklmnopqrstuvwxyz';

    // Lista de todas las posibles orientaciones
    var allOrientations = ['horizontal','horizontalBack','vertical','verticalUp',
                           'diagonal','diagonalUp','diagonalBack','diagonalUpBack'];
    
    // La definición de la orientación, calcula el siguiente cuadrado dado un
    // cuadrado inicial (x, y) y distancia (i) desde ese cuadrado.
    var orientations = {
      horizontal:     function(x,y,i) { return {x: x+i, y: y  }; },
      horizontalBack: function(x,y,i) { return {x: x-i, y: y  }; },
      vertical:       function(x,y,i) { return {x: x,   y: y+i}; },
      verticalUp:     function(x,y,i) { return {x: x,   y: y-i}; },
      diagonal:       function(x,y,i) { return {x: x+i, y: y+i}; },
      diagonalBack:   function(x,y,i) { return {x: x-i, y: y+i}; },
      diagonalUp:     function(x,y,i) { return {x: x+i, y: y-i}; },
      diagonalUpBack: function(x,y,i) { return {x: x-i, y: y-i}; }
    };

    // Determina si una orientación es posible dado el cuadrado inicial (x, y),
    // la altura (h) y la anchura (w) de la sopa de letra y la longitud de la palabra (l).
    // Devuelve verdadero si la palabra encaja comenzando en el cuadrado proporcionado usando
    // la orientación especificada.
    var checkOrientations = {
      horizontal:     function(x,y,h,w,l) { return w >= x + l; },
      horizontalBack: function(x,y,h,w,l) { return x + 1 >= l; },
      vertical:       function(x,y,h,w,l) { return h >= y + l; },
      verticalUp:     function(x,y,h,w,l) { return y + 1 >= l; },
      diagonal:       function(x,y,h,w,l) { return (w >= x + l) && (h >= y + l); },
      diagonalBack:   function(x,y,h,w,l) { return (x + 1 >= l) && (h >= y + l); },
      diagonalUp:     function(x,y,h,w,l) { return (w >= x + l) && (y + 1 >= l); },
      diagonalUpBack: function(x,y,h,w,l) { return (x + 1 >= l) && (y + 1 >= l); }
    };

    // Determina el siguiente cuadrado válido posible dado que el cuadrado (x, y) era]
    // inválido y una longitud de palabra de (l). Esto reduce en gran medida el número de
    // cuadrados que se deben marcar. Devolver {x: x + 1, y: y} siempre funcionará
    // pero no será óptimo.
    var skipOrientations = {
      horizontal:     function(x,y,l) { return {x: 0,   y: y+1  }; },
      horizontalBack: function(x,y,l) { return {x: l-1, y: y    }; },
      vertical:       function(x,y,l) { return {x: 0,   y: y+100}; },
      verticalUp:     function(x,y,l) { return {x: 0,   y: l-1  }; },
      diagonal:       function(x,y,l) { return {x: 0,   y: y+1  }; },
      diagonalBack:   function(x,y,l) { return {x: l-1, y: x>=l-1?y+1:y    }; },
      diagonalUp:     function(x,y,l) { return {x: 0,   y: y<l-1?l-1:y+1  }; },
      diagonalUpBack: function(x,y,l) { return {x: l-1, y: x>=l-1?y+1:y  }; }
    };


    var fillPuzzle = function (words, options) {

      var puzzle = [], i, j, len;

      // Inicia la sopa de letras con espacios en blanco
      for (i = 0; i < options.height; i++) {
        puzzle.push([]);
        for (j = 0; j < options.width; j++) {
          puzzle[i].push('');
        }
      }

      // Agrega cada rompacabezas una a una
      for (i = 0, len = words.length; i < len; i++) {
        if (!placeWordInPuzzle(puzzle, options, words[i])) {
          // si alguna palabra con encaja en la sopa de letra la anula
          return null;
        }
      }

      // retorna la sola de letras
      return puzzle;
    };

    var placeWordInPuzzle = function (puzzle, options, word) {

      // Encuentra todas las posibilidades optimas donde se puedan encajar las palabras
      var locations = findBestLocations(puzzle, options, word);

      if (locations.length === 0) {
        return false;
      }

      // Seleciona una ubicacion al azar y la pone
      var sel = locations[Math.floor(Math.random() * locations.length)];
      placeWord(puzzle, word, sel.x, sel.y, orientations[sel.orientation]);

      return true;
    };

    var findBestLocations = function (puzzle, options, word) {

      var locations = [],
          height = options.height,
          width = options.width,
          wordLength = word.length,
          maxOverlap = 0;

      // Recorre todas las orientaciones posibles en la posicion
      for (var k = 0, len = options.orientations.length; k < len; k++) {
        
        var orientation = options.orientations[k],
            check = checkOrientations[orientation],
            next = orientations[orientation],
            skipTo = skipOrientations[orientation],
            x = 0, y = 0;

        // Recorre cada posicion en el tablero
        while( y < height ) {

          // Ve si la orientacion es posible en la ubicacion
          if (check(x, y, height, width, wordLength)) {

            // Determina si la palabra encaja en la posicion actual
            var overlap = calcOverlap(word, puzzle, x, y, next);

            // Si la superposicion es mayor que las anteriores
            if (overlap >= maxOverlap || (!options.preferOverlap && overlap > -1)) {
              maxOverlap = overlap;
              locations.push({x: x, y: y, orientation: orientation, overlap: overlap});
            }

            x++;
            if (x >= width) {
              x = 0;
              y++;
            }
          }
          else {
            //si la celda actual no es valida la salta
            var nextPossible = skipTo(x,y,wordLength);
            x = nextPossible.x;
            y = nextPossible.y;
          }

        }
      }
      return options.preferOverlap ?
             pruneLocations(locations, maxOverlap) :
             locations;
    };

    var calcOverlap = function (word, puzzle, x, y, fnGetSquare) {
      var overlap = 0;

      // Atraviesa los cuadros para ver si la palabra encaja
      for (var i = 0, len = word.length; i < len; i++) {

        var next = fnGetSquare(x, y, i),
            square = puzzle[next.y][next.x];
        
        // si el cuadrado de la sopa de letras ya contiene la letra
        // está buscando, luego cuéntelo como un cuadrado superpuesto
        if (square === word[i]) {
          overlap++;
        }
        // Si contiene una palabra diferente no encaja
        else if (square !== '' ) {
          return -1;
        }
      }
      return overlap;
    };

    var pruneLocations = function (locations, overlap) {

      var pruned = [];
      for(var i = 0, len = locations.length; i < len; i++) {
        if (locations[i].overlap >= overlap) {
          pruned.push(locations[i]);
        }
      }

      return pruned;
    };

    var placeWord = function (puzzle, word, x, y, fnGetSquare) {
      for (var i = 0, len = word.length; i < len; i++) {
        var next = fnGetSquare(x, y, i);
        puzzle[next.y][next.x] = word[i];
      }
    };

    return {

      validOrientations: allOrientations,

      orientations: orientations,

      newPuzzle: function(words, settings) {
        var wordList, puzzle, attempts = 0, opts = settings || {};

        // copia y ordena las palabras por longitud, insertando palabras en la sopa de letras
        wordList = words.slice(0).sort( function (a,b) {
          return (a.length < b.length) ? 1 : 0;
        });
        
        // Inica las opciones
        var options = {
          height:       opts.height || wordList[0].length,
          width:        opts.width || wordList[0].length,
          orientations: opts.orientations || allOrientations,
          fillBlanks:   opts.fillBlanks !== undefined ? opts.fillBlanks : true,
          maxAttempts:  opts.maxAttempts || 3,
          preferOverlap: opts.preferOverlap !== undefined ? opts.preferOverlap : true
        };

        // Agrega las palabras a la sopa de letras los cuales son aleatorios
        while (!puzzle) {
          while (!puzzle && attempts++ < options.maxAttempts) {
            puzzle = fillPuzzle(wordList, options);
          }

          if (!puzzle) {
            options.height++;
            options.width++;
            attempts = 0;
          }
        }

        // Rellena los espacios vacios con letras al azar
        if (options.fillBlanks) {
          this.fillBlanks(puzzle, options);
        }

        return puzzle;
      },

      fillBlanks: function (puzzle) {
        for (var i = 0, height = puzzle.length; i < height; i++) {
          var row = puzzle[i];
          for (var j = 0, width = row.length; j < width; j++) {

            if (!puzzle[i][j]) {
              var randomLetter = Math.floor(Math.random() * letters.length);
              puzzle[i][j] = letters[randomLetter];
            }
          }
        }
      },

      solve: function (puzzle, words) {
        var options = {
                        height:       puzzle.length,
                        width:        puzzle[0].length,
                        orientations: allOrientations,
                        preferOverlap: true
                      },
            found = [],
            notFound = [];

        for(var i = 0, len = words.length; i < len; i++) {
          var word = words[i],
              locations = findBestLocations(puzzle, options, word);

          if (locations.length > 0 && locations[0].overlap === word.length) {
            locations[0].word = word;
            found.push(locations[0]);
          }
          else {
            notFound.push(word);
          }
        }

        return { found: found, notFound: notFound };
      },

      print: function (puzzle) {
        var puzzleString = '';
        for (var i = 0, height = puzzle.length; i < height; i++) {
          var row = puzzle[i];
          for (var j = 0, width = row.length; j < width; j++) {
            puzzleString += (row[j] === '' ? ' ' : row[j]) + ' ';
          }
          puzzleString += '\n';
        }

        console.log(puzzleString);
        return puzzleString;
      }
    };
  };

  var root = typeof exports !== "undefined" && exports !== null ? exports : window;
  root.wordfind = WordFind();

}).call(this);