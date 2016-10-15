# -*- coding: utf-8 -*-

from flask import render_template, request
from flask_socketio import join_room
from app import app, socketio
from .game_master import GameMaster

# The max distance used to compute players score
SCORE_MAX_DISTANCE = app.config.get('SCORE_MAX_DISTANCE')

# The time given to a player to answer a question
MAX_RESPONSE_TIME = app.config.get('MAX_RESPONSE_TIME')

# The time between two turns
BETWEEN_TURNS_DURATION = app.config.get('BETWEEN_TURNS_DURATION')

# How many answers are used to compute user score
LEADERBOARD_ANSWER_COUNT = app.config.get('LEADERBOARD_ANSWER_COUNT')

# Create the game master that manage games life cycles
game_master = GameMaster()


@app.route('/')
@app.route('/game')
def render_game():
    return render_template('game.html',
                           MAX_RESPONSE_TIME=MAX_RESPONSE_TIME,
                           LEADERBOARD_ANSWER_COUNT=LEADERBOARD_ANSWER_COUNT)


@socketio.on('join_game')
def join_game(game_id, player_name):
    app.logger.info('{player_name} has joined the game {game_id}'.format(game_id=game_id, player_name=player_name))

    # Let player join the room hosting the game
    join_room(game_id)

    game = game_master.get_game(game_id)

    # If the game does not exist yet, create it
    if not game:
        game = game_master.create_game(game_id, SCORE_MAX_DISTANCE, MAX_RESPONSE_TIME, LEADERBOARD_ANSWER_COUNT,
                                       BETWEEN_TURNS_DURATION)

    # Add the player to the game
    game.add_player(request.sid, player_name)


@socketio.on('disconnect')
def leave_games():
    for game in game_master.games:
        # Remove the player from the game
        game.remove_player(request.sid)


@socketio.on('answer')
def store_answer(game_id, value):   
    game = game_master.get_game(game_id)

    # Store new answer
    if game:
        game.store_answer(request.sid, value)
