"""Application routes module.

This module contains all the route definitions and handlers for the Flask application.
"""

from flask import Blueprint, render_template, request, jsonify
from .logic import get_gpt_response, get_diagnostic_recommendation, get_next_question, create_diagnostic_session, answer_diagnostic_question, get_diagnostic_session, get_initial_greeting, handle_initial_response
from icecream import ic
bp = Blueprint("main", __name__)

@bp.route("/")
def home():
    return render_template("index.html")


@bp.route("/health", methods=["GET"])
def health_check():
    return {"status": "healthy"}

@bp.route("/message", methods=["POST"])
def message():
    """
    Handle user messages and return GPT-4o-mini responses.
    
    Expected JSON payload:
    {
        "text": "User's message here"
    }
    
    Returns:
    {
        "reply": "GPT's response here"
    }
    """
    # Get the JSON body from the request
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({
            "error": "Please send JSON with a 'text' field",
            "example": {"text": "Your message here"}
        }), 400

    user_message = data["text"]
    
    # Validate message length
    if len(user_message.strip()) == 0:
        return jsonify({"error": "Message cannot be empty"}), 400
    
    if len(user_message) > 1000:
        return jsonify({"error": "Message too long. Please limit to 1000 characters."}), 400

    # Get response from GPT-4o-mini
    gpt_reply = get_gpt_response(user_message)

    return jsonify({
        "reply": gpt_reply,
        "model": "gpt-4o-mini",
        "status": "success"
    })

@bp.route("/diagnostic", methods=["POST"])
def diagnostic():
    """
    Handle diagnostic questions and provide router restart recommendation.
    
    Expected JSON payload:
    {
        "answers": {
            "0": true,
            "1": false,
            ...
        }
    }
    
    Returns:
    {
        "recommendation": "RESTART_ROUTER" | "CONTACT_SUPPORT",
        "score": integer,
        "reasoning": "explanation"
    }
    """
    data = request.get_json()
    
    if not data or "answers" not in data:
        return jsonify({
            "error": "Please send JSON with an 'answers' field",
            "example": {"answers": {"0": True, "1": False}}
        }), 400
    
    answers = data["answers"]
    
    # Convert string keys to integers and validate answers
    try:
        processed_answers = {}
        for key, value in answers.items():
            processed_answers[int(key)] = bool(value)
    except (ValueError, TypeError):
        return jsonify({
            "error": "Answer keys must be integers and values must be boolean"
        }), 400
    
    # Get diagnostic recommendation
    result = get_diagnostic_recommendation(processed_answers)
    
    return jsonify({
        "recommendation": result["recommendation"],
        "score": result["score"],
        "reasoning": result["reasoning"],
        "status": "success"
    })

@bp.route("/greeting", methods=["GET"])
def greeting():
    """
    Get the initial greeting message.
    
    Returns:
    {
        "greeting": "Hello! I'm RouteThis..."
    }
    """
    return jsonify({
        "greeting": get_initial_greeting(),
        "status": "success"
    })

@bp.route("/initial", methods=["POST"])
def initial_response():
    """
    Handle the user's initial response to the greeting.
    
    Expected JSON payload:
    {
        "message": "User's initial message",
        "session_id": "unique_session_identifier"
    }
    
    Returns:
    {
        "response": "AI's acknowledgment",
        "start_diagnostic": boolean,
        "first_question": {...} or null
    }
    """
    data = request.get_json()
    
    if not data or "message" not in data or "session_id" not in data:
        return jsonify({
            "error": "Please send JSON with 'message' and 'session_id' fields",
            "example": {"message": "I'm having WiFi issues", "session_id": "user123_session456"}
        }), 400
    
    user_message = data["message"]
    session_id = data["session_id"]
    
    # Validate message length
    if len(user_message.strip()) == 0:
        return jsonify({"error": "Message cannot be empty"}), 400
    
    if len(user_message) > 1000:
        return jsonify({"error": "Message too long. Please limit to 1000 characters."}), 400
    
    result = handle_initial_response(user_message, session_id)
    
    return jsonify({
        "response": result["response"],
        "start_diagnostic": result["start_diagnostic"],
        "first_question": result.get("first_question"),
        "status": "success"
    })

@bp.route("/diagnostic/start", methods=["POST"])
def start_diagnostic():
    """
    Start a new diagnostic session.
    
    Expected JSON payload:
    {
        "session_id": "unique_session_identifier"
    }
    
    Returns:
    {
        "question": "first question text",
        "index": 0,
        "complete": false,
        "session_id": "session_identifier"
    }
    """
    data = request.get_json()
    
    if not data or "session_id" not in data:
        return jsonify({
            "error": "Please send JSON with a 'session_id' field",
            "example": {"session_id": "user123_session456"}
        }), 400
    
    session_id = data["session_id"]
    first_question = create_diagnostic_session(session_id)
    
    return jsonify({
        "question": first_question.get("question"),
        "index": first_question.get("index"),
        "complete": first_question["complete"],
        "session_id": session_id,
        "status": "success"
    })

@bp.route("/diagnostic/answer", methods=["POST"])
def answer_question():
    """
    Answer the current question in a diagnostic session.
    
    Expected JSON payload:
    {
        "session_id": "unique_session_identifier",
        "answer": true/false
    }
    
    Returns:
    {
        "complete": boolean,
        "next_question": {...} or null,
        "recommendation": {...} or null
    }
    """
    data = request.get_json()
    
    if not data or "session_id" not in data or "answer" not in data:
        return jsonify({
            "error": "Please send JSON with 'session_id' and 'answer' fields",
            "example": {"session_id": "user123_session456", "answer": True}
        }), 400
    
    session_id = data["session_id"]
    ic(data["answer"],session_id)
    # answer = bool(data["answer"])
    answer = data["answer"]

    result = answer_diagnostic_question(session_id, answer)
    
    if "error" in result:
        return jsonify(result), 400
    
    return jsonify({
        "complete": result["complete"],
        "next_question": result.get("next_question"),
        "recommendation": result.get("recommendation"),
        "status": "success"
    })


# @bp.route("/diagnostic/restart_instructions/photo_upload", methods=["POST"])
# def answer_question():
#
#     data = request.get_json()
#
#     if not data or "session_id" not in data or "answer" not in data:
#         return jsonify({
#             "error": "Please send JSON with 'session_id' and 'answer' fields",
#             "example": {"session_id": "user123_session456", "answer": True}
#         }), 400
#
#     session_id = data["session_id"]
#     ic(data["answer"], session_id)
#     # answer = bool(data["answer"])
#     answer = data["answer"]
#
#     result = answer_diagnostic_question(session_id, answer)
#
#     if "error" in result:
#         return jsonify(result), 400
#
#     return jsonify({
#         "complete": result["complete"],
#         "next_question": result.get("next_question"),
#         "recommendation": result.get("recommendation"),
#         "status": "success"
#     })



@bp.route("/diagnostic/status/<session_id>", methods=["GET"])
def get_diagnostic_status(session_id):
    """
    Get the current status of a diagnostic session.
    
    Returns:
    {
        "session_exists": boolean,
        "current_question": {...} or null,
        "completed": boolean
    }
    """
    session = get_diagnostic_session(session_id)
    
    if not session:
        return jsonify({
            "session_exists": False,
            "current_question": None,
            "completed": False,
            "status": "success"
        })
    
    current_question = session.get_current_question() if not session.completed else None
    
    return jsonify({
        "session_exists": True,
        "current_question": current_question,
        "completed": session.completed,
        "recommendation": session.recommendation,
        "status": "success"
    })

@bp.route("/question/<int:question_index>", methods=["GET"])
def get_question(question_index):
    """
    Get a specific diagnostic question by index (legacy endpoint).
    
    Returns:
    {
        "question": "question text",
        "index": integer,
        "complete": boolean
    }
    """
    result = get_next_question(question_index)
    
    return jsonify({
        "question": result.get("question"),
        "index": result.get("index", question_index),
        "complete": result["complete"],
        "status": "success"
    }) 