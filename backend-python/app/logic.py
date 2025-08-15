"""Business logic module.

This module contains the core business logic for the application,
including AI service integrations and data processing.
"""

import os
import networkx as nx
from openai import OpenAI
from dotenv import load_dotenv
from icecream import ic

AI_PROMPT = """You are RouteThis, a friendly AI assistant specifically designed to help users troubleshoot router and WiFi connectivity issues. You have a warm, conversational personality and make users feel comfortable while staying strictly focused on router troubleshooting.

SCOPE: You ONLY help with router, WiFi, and internet connectivity issues. If users ask about anything else (weather, cooking, general questions, etc.), politely redirect: "I'm only here to help with router and WiFi troubleshooting issues. How can I assist you with your internet connection today?"

CONVERSATIONAL STYLE:
- Be warm, friendly, and human-like
- Acknowledge user issues with empathy: "Oh, I understand that's frustrating" or "I see what you mean"
- Use natural transitions: "Let me help you figure this out" or "That makes sense, let me ask you something else"
- Occasionally add conversational asides: "This is a common issue" or "Good thinking on checking that"
- Sound helpful and reassuring throughout

INITIAL GREETING: When users first reach out, respond warmly: "Hello! I'm RouteThis — your router troubleshooter. I'm here to help you get your internet connection back up and running. What kind of trouble are you experiencing?"

DIAGNOSTIC QUESTIONS: After understanding their issue, explain you'll ask some questions to diagnose the problem properly, then proceed with systematic troubleshooting to determine if a router restart is needed."""

class RouterDiagnosticGraph:
    def __init__(self):
        self.graph = nx.MultiDiGraph()
        self.questions = [
            "Is your wifi router POWER LED on?",
            "Is router/modem connected to the internet? (Is the 'internet' LED solid?)",
            "Does visiting 192.168.1.1 take you to router login page?",
            "Are there other devices that are having internet issues?",
            "Do you keep connecting and reconnecting to the internet?",
            "Do non-working websites work when connected via mobile data instead of wifi?",
            "Is there noticeable lag and buffering in games and videos?",
            "Are there spikes and drops in internet speed?",
            "No networking apps such as VPNs have been recently installed on your device?",
            "Run Algorithm"
        ]
        self._build_graph()
        
    def _build_graph(self):
        for question in self.questions:
            self.graph.add_node(question, visited_count=0, answer=None)
        
        # Add edges with weights based on likelihood of needing router restart
        self.graph.add_edge(self.questions[0], self.questions[1], answer=True, weight=-2)
        self.graph.add_edge(self.questions[0], self.questions[-1], answer=False, weight=5)
        self.graph.add_edge(self.questions[1], self.questions[2], answer=True, weight=-2)
        self.graph.add_edge(self.questions[1], self.questions[-1], answer=False, weight=4)
        self.graph.add_edge(self.questions[2], self.questions[3], answer=True, weight=4)
        self.graph.add_edge(self.questions[2], self.questions[-1], answer=False, weight=5)
        
        self.graph.add_edge(self.questions[3], self.questions[4], answer=True, weight=4)
        self.graph.add_edge(self.questions[3], self.questions[4], answer=False, weight=-3)
        self.graph.add_edge(self.questions[4], self.questions[5], answer=True, weight=3)
        self.graph.add_edge(self.questions[4], self.questions[5], answer=False, weight=-2)
        self.graph.add_edge(self.questions[5], self.questions[6], answer=True, weight=3)
        self.graph.add_edge(self.questions[5], self.questions[6], answer=False, weight=-2)
        self.graph.add_edge(self.questions[6], self.questions[7], answer=True, weight=2)
        self.graph.add_edge(self.questions[6], self.questions[7], answer=False, weight=-2)
        self.graph.add_edge(self.questions[7], self.questions[8], answer=True, weight=3)
        self.graph.add_edge(self.questions[7], self.questions[8], answer=False, weight=-2)
        self.graph.add_edge(self.questions[8], self.questions[-1], answer=True, weight=3)
        self.graph.add_edge(self.questions[8], self.questions[-1], answer=False, weight=-3)
    
    def get_recommendation(self, answers):
        """
        Process user answers through the decision graph.
        
        Args:
            answers (dict): Dictionary mapping question indices to boolean answers
            
        Returns:
            dict: Contains recommendation and score
        """
        current_node = self.questions[0]
        score = 0
        path = []
        
        while current_node != self.questions[-1]:
            path.append(current_node)
            question_index = self.questions.index(current_node)
            
            if question_index not in answers:
                break
                
            user_answer = answers[question_index]
            if user_answer.lower() in ["yes", "y", "true", "t"]:
                user_answer = True
            elif user_answer.lower() in ["no", "n", "false", "f"]:
                user_answer = False
            elif user_answer.lower() == "?":
                user_answer = "?"

            self.graph.nodes[current_node]["answer"] = user_answer
            self.graph.nodes[current_node]["visited_count"] += 1
            
            next_node = None
            for _, target, data in self.graph.out_edges(current_node, data=True):
                ic(score)
                if type(user_answer) == str and user_answer.lower() == "?":
                    out_edges_sum = sum(data.get("weight", 0) for _, _, data in self.graph.out_edges(current_node, data=True))
                    score += out_edges_sum
                    next_node = target
                    break

                elif data.get("answer") == user_answer:
                    score += data.get("weight", 0)
                    next_node = target
                    break
            
            if next_node is None:
                break
                
            current_node = next_node
        
        recommendation = "RESTART_ROUTER" if score >= 0 else "CONTACT_SUPPORT"
        
        return {
            "recommendation": recommendation,
            "score": score,
            "path": path,
            "reasoning": f"Based on the info you have provided. I recommend " + "restarting your router" if score >= 0 else
                         "contacting technical support at +1-ROUTHIS4ME for further assistance. I'm sorry I could not be of much help :("
        }
# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY", "your_openai_api_key_here")
)


# Initialize diagnostic graph
diagnostic_graph = RouterDiagnosticGraph()

def get_gpt_response(user_message):
    """
    Get response from GPT-4o-mini (cheapest option) via OpenAI API.
    
    Args:
        user_message (str): The user's input message
        
    Returns:
        str: GPT's response or error message
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Cheapest GPT model available
            messages=[
                {
                    "role": "system", 
                    "content": AI_PROMPT
                },
                {
                    "role": "user", 
                    "content": user_message
                }
            ],
            max_tokens=150,  # Limit tokens to control costs
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        return f"Sorry, I'm having trouble connecting to the AI service. Error: {str(e)}"

def get_diagnostic_recommendation(answers):
    """
    Get router restart recommendation using the diagnostic graph.
    
    Args:
        answers (dict): Dictionary mapping question indices to boolean answers
        
    Returns:
        dict: Diagnostic recommendation and reasoning
    """
    return diagnostic_graph.get_recommendation(answers)

class DiagnosticSession:
    """Manages a single diagnostic session with state tracking."""
    
    def __init__(self):
        self.current_question_index = 0
        self.answers = {}
        self.completed = False
        self.recommendation = None
        self.conversational_intros = [
            "Great! Let me start by checking the basics. ",
            "Perfect, that helps me understand the situation. Now, ",
            "I see. Let me ask you something else - ",
            "That's good information. Next, I need to know: ",
            "Okay, that makes sense. Another quick question: ",
            "Thanks for that detail. Let me check something else: ",
            "Alright, I'm getting a clearer picture. ",
            "That's helpful context. One more thing: ",
            "I understand. This next question is important: "
        ]
    
    def get_current_question(self):
        """Get the current question for this session."""
        if self.current_question_index >= len(diagnostic_graph.questions) - 1:
            return {"complete": True, "question": None, "index": None}
        
        # Add conversational intro to make questions more human-like
        base_question = diagnostic_graph.questions[self.current_question_index]
        intro = self.conversational_intros[min(self.current_question_index, len(self.conversational_intros) - 1)]
        conversational_question = intro + base_question.lower()
        
        return {
            "complete": False,
            "question": conversational_question,
            "raw_question": base_question,
            "index": self.current_question_index
        }
    
    def answer_question(self, answer):
        """Answer the current question and advance to next."""
        if self.completed:
            return {"error": "Session already completed"}
        
        # Store the answer
        self.answers[self.current_question_index] = answer
        
        # Check if we should skip to end based on graph logic
        current_node = diagnostic_graph.questions[self.current_question_index]
        
        # Find next node based on answer
        next_node = None
        for _, target, data in diagnostic_graph.graph.out_edges(current_node, data=True):


            if answer.lower() in ["yes", "y", "true", "t", "?"]:
                if data.get("answer") == True:
                    next_node = target
                    break
            elif answer.lower() in ["no", "n", "false", "f"]:
                if data.get("answer") == False:
                    next_node = target
                    break
        
        if next_node == diagnostic_graph.questions[-1]:  # "Run Algorithm"
            self.completed = True
            ic(self.answers)
            self.recommendation = diagnostic_graph.get_recommendation(self.answers)
            return {
                "complete": True,
                "recommendation": self.recommendation,
                "next_question": None
            }
        
        # Move to next question in sequence
        self.current_question_index += 1
        
        # Check if we've reached the end
        if self.current_question_index >= len(diagnostic_graph.questions) - 1:
            self.completed = True
            self.recommendation = diagnostic_graph.get_recommendation(self.answers)
            return {
                "complete": True,
                "recommendation": self.recommendation,
                "next_question": None
            }
        
        next_question = self.get_current_question()
        return {
            "complete": False,
            "next_question": next_question,
            "recommendation": None
        }

# Store active sessions (in production, use Redis or database)
active_sessions = {}

def create_diagnostic_session(session_id):
    """Create a new diagnostic session."""
    session = DiagnosticSession()
    active_sessions[session_id] = session
    return session.get_current_question()

def get_diagnostic_session(session_id):
    """Get an existing diagnostic session."""
    return active_sessions.get(session_id)

def answer_diagnostic_question(session_id, answer):
    """Answer a question in a diagnostic session."""
    session = active_sessions.get(session_id)
    if not session:
        return {"error": "Session not found"}
    
    return session.answer_question(answer)

def get_initial_greeting():
    """Get the initial greeting message."""
    return "Hello! I'm RouteThis — your router troubleshooter. I'm here to help you get your internet connection back up and running. What kind of trouble are you experiencing?"

def handle_initial_response(user_message, session_id):
    """
    Handle the user's initial response to the greeting and determine if we should start diagnostics.
    
    Args:
        user_message (str): User's response to the greeting
        session_id (str): Session identifier
        
    Returns:
        dict: Contains response and whether to start diagnostic flow
    """
    try:
        # First check if message is router-related using GPT
        scope_check_prompt = f"The user said: '{user_message}'. Is this related to router, WiFi, or internet connectivity issues? Reply with only 'YES' or 'NO'."
        scope_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": AI_PROMPT},
                {"role": "user", "content": scope_check_prompt}
            ],
            max_tokens=10,
            temperature=0.1
        )
        
        is_router_related = scope_response.choices[0].message.content.strip().upper() == "YES"
        
        if not is_router_related:
            return {
                "response": "I'm only here to help with router and WiFi troubleshooting issues. How can I assist you with your internet connection today?",
                "start_diagnostic": False
            }
        
        # Generate empathetic response and start diagnostic
        empathy_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": AI_PROMPT},
                {"role": "user", "content": f"User said they have this router/WiFi issue: '{user_message}'. Give a brief empathetic acknowledgment (1-2 sentences) and say you'll ask some questions to diagnose it. Be conversational and understanding."}
            ],
            max_tokens=100,
            temperature=0.7
        )
        
        acknowledgment = empathy_response.choices[0].message.content.strip()
        
        # Create diagnostic session and get first question
        first_question = create_diagnostic_session(session_id)
        
        return {
            "response": acknowledgment,
            "start_diagnostic": True,
            "first_question": first_question
        }
        
    except Exception as e:
        return {
            "response": "I understand you're having some connectivity issues. Let me help you troubleshoot that step by step.",
            "start_diagnostic": True,
            "first_question": create_diagnostic_session(session_id)
        }

def get_next_question(current_question_index=0):
    """
    Get the next diagnostic question (legacy function for compatibility).
    
    Args:
        current_question_index (int): Index of current question
        
    Returns:
        dict: Question details or completion status
    """
    if current_question_index >= len(diagnostic_graph.questions) - 1:
        return {"complete": True, "question": None}
    
    return {
        "complete": False,
        "question": diagnostic_graph.questions[current_question_index],
        "index": current_question_index
    }


if __name__ == "__main__":
    # Initialize the diagnostic graph
    diagnostic_graph = RouterDiagnosticGraph()

    # Simulate user answers (True/False for each question index)
    simulated_answers = {
        0: True,  # POWER LED is on
        1: True,  # Router is connected to the internet
        2: True, # Cannot access router login page
        3: "?",  # Other devices are having issues
        4: False, # No frequent reconnecting
        5: "?",  # Websites work on mobile data
        6: False, # No noticeable lag
        7: "?",  # Spikes in internet speed
        8: True   # No VPNs recently installed
    }

    # Get the recommendation based on the simulated answers
    result = diagnostic_graph.get_recommendation(simulated_answers)

    # Print the results
    print("Traversal Path:", result["path"])
    print("Final Score:", result["score"])
    print("Recommendation:", result["recommendation"])
    print("Reasoning:", result["reasoning"])