var progressBar = null,
    socket = null,
    playerNameStorage = 'player_name',
    gameId = 'default';

$(document).ready(function () {

    // Create the progress bar
    progressBar = new ProgressBar.Line('#progress', {
        color: '#FCB03C',
        duration: $('#progress').data('max-response-time') * 1000
    });

    // Look for a previously entered player name in local storage
    if (typeof(Storage) !== "undefined" && localStorage.getItem(playerNameStorage)) {
        // If player name found, start the game using it
        joinGame(localStorage.getItem(playerNameStorage));
    } else {
        // Else, ask for player name
        login();
    }
});

/**
 * Ask the player for his name and store it in local storage if possible.
 * Once the player has entered a valid name, start the game.
 */
function login() {

    var loginModal = $("#loginModal").modal({
        escapeClose: false,
        clickClose: false,
        showClose: false
    });

    $("#loginForm").submit(function (event) {

        event.preventDefault();

        var playerName = $('#playerName').val();

        // Validate player name
        if (!playerName) {

            $("#loginError").text('Please select a player name.');

        } else if (playerName.length > 50) {

            $("#loginError").text('Player name must contain less than 50 characters.');

        } else {

            // Store player name if possible
            if (typeof(Storage) !== "undefined") {
                localStorage.setItem(playerNameStorage, playerName);
            }

            // Launch the game
            joinGame(playerName);

            $.modal.close();

        }

    });

}

/**
 * Join the game using the given player name.
 * @param playerName
 */
function joinGame(playerName) {
    // Create the web socket
    socket = io.connect('//' + document.domain + ':' + location.port);

    // Handle new turn
    socket.on('new_turn', handleNewTurn);

    // Handle leaderboard update
    socket.on('leaderboard_update', updateLeaderboard);

    // Join the default game
    socket.emit('join_game', gameId, playerName);

}

/**
 * Update the leaderboard to show top ten players and user rank.
 * @param data
 */
function updateLeaderboard(data) {

    // Remove previous scores
    $('.score_row').remove();

    for (var i = 0; i < 10; i++) {

        if (data.player_rank == i) {

            $('#leaderboard table tr:last').after('<tr class="score_row user_score"><td>' + (i + 1) + '</td><td>You</td><td>' + data.player_score + '</td></tr>');

        } else if (data.top_ten[i]) {

            var row = $('<tr class="score_row">')
                .append($('<td>').text(i+1))
                .append($('<td>').text(data.top_ten[i].player_name))
                .append($('<td>').text(data.top_ten[i].score))

            $('#leaderboard table tr:last').after(row);

        }

    }

    if(data.player_rank >= 10) {

        $('#leaderboard table tr:last').after('<tr class="score_row user_score"><td>' + (data.player_rank + 1) + '</td><td>You</td><td>' + data.player_score + '</td></tr>');

    }

}

/**
 * Start a new game turn.
 * Show the city to locate and listen for player answers.
 * @param data
 */
function handleNewTurn(data) {
    //Temporary question modification
    $('input[type=radio][name="radioName"]').prop('checked', false);
    $('#question').html(data.word);
    $('#radio1')[0].nextSibling.data = data.options[0]
    $('#radio2')[0].nextSibling.data = data.options[1]
    $('#radio3')[0].nextSibling.data = data.options[2]
    $('#radio4')[0].nextSibling.data = data.options[3]
    // Show countdown timer
    progressBar.animate(1);

    $('input[type=radio][name=radioName]').change(answer)
    // Enable answers for this turn
    // map.on('click', answer);
    // Handle end of turn
    socket.on('end_of_turn', handleEndOfTurn);

    // Handle player results
    socket.on('player_results', showPlayerResults);

}

/**
 * End current turn.
 * Show best answer and correct answer for this turn.
 * @param data
 */
function handleEndOfTurn(data) {

    // Disable answers listener
    // map.off('click', answer);

    // Reset countdown timer
    progressBar.set(0);

    // Update game rules
    $('#game_rules').html('Waiting for the next turn');

}

/**
 * Show player results for the last turn.
 * @param data
 */
function showPlayerResults(data) {

}

/**
 * Send user answer to the server.
 * @param e
 */
function answer(e) {
    socket.emit('answer', gameId, e.currentTarget.nextSibling.textContent);
    // Disable answers for this turn
    // map.off('click', answer);
}

/**
 * Round a float value to 2 decimal
 * @param value
 * @returns {number}
 */
function round(value) {
    return Math.round(value * 100) / 100
}

/**
 * Animate user score
 * @param score
 */
function animateScore(score) {
    var duration = 1000;
    // no timer shorter than 50ms (not really visible any way)
    var minTimer = 50;
    // calc step time to show all interediate values
    var stepTime = Math.abs(Math.floor(duration / score));

    // never go below minTimer
    stepTime = Math.max(stepTime, minTimer);

    // get current time and calculate desired end time
    var startTime = new Date().getTime();
    var endTime = startTime + duration;
    var timer;

    function run() {
        var now = new Date().getTime();
        var remaining = Math.max((endTime - now) / duration, 0);
        var value = Math.round(score - (remaining * score));
        $('#score_value').text(value);
        if (value == score) {
            clearInterval(timer);
        }
    }

    timer = setInterval(run, stepTime);
    run();
}
