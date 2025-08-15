import "./home.css";
import { Splash } from "../comps/Splash";
import React, { useEffect, useRef, useState } from "react";
import { voiceService, speakWelcome, speakText } from "../services/Voice";
import { VoiceVisualizer } from "../comps/VoiceVisualizer";
import { IoChatbubbleEllipsesOutline, IoMicOutline } from "react-icons/io5";
import { IoIosSend } from "react-icons/io";
import { useSpeechRecognition } from "../services/SpeechRecog";
import {
	startDiagnostic,
	answerDiagnosticQuestion,
	sendMessage,
	getGreeting,
	handleInitialResponse,
} from "../services/App.service";
import type {
	DiagnosticQuestion,
	DiagnosticRecommendation,
} from "../services/App.service";

// Chat message interface
interface ChatMessage {
	id: string;
	text: string;
	sender: "user" | "ai";
	timestamp: Date;
	model?: string;
}

export function Home() {
	const hasPlayedRef = useRef(false);
	const [isVoiceActive, setIsVoiceActive] = useState(false);
	const [voiceAmplitude, setVoiceAmplitude] = useState(0.5);
	const [chatSelected, setChatSelected] = useState(false);
	const [voiceSelected, setVoiceSelected] = useState(true);
	const [isVoiceMuted, setIsVoiceMuted] = useState(false);
	const [userInput, setUserInput] = useState("");

	// Diagnostic state
	const [sessionId, setSessionId] = useState<string>("");
	const [currentQuestion, setCurrentQuestion] =
		useState<DiagnosticQuestion | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [recommendation, setRecommendation] =
		useState<DiagnosticRecommendation | null>(null);
	const [diagnosticComplete, setDiagnosticComplete] = useState(false);
	const [showInitialGreeting, setShowInitialGreeting] = useState(true);
	const [diagnosticStarted, setDiagnosticStarted] = useState(false);

	// Chat system for displaying Q&A flow
	const [chatMessages, setChatMessages] = useState<Map<string, ChatMessage>>(
		new Map()
	);
	const [messageOrder, setMessageOrder] = useState<string[]>([]);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	const {
		isListening,
		transcript,
		startListening,
		stopListening,
		resetTranscript,
		isSupported,
	} = useSpeechRecognition();

	// Helper function to add message to chat
	const addMessage = (text: string, sender: "user" | "ai", model?: string) => {
		const messageId = `${Date.now()}-${Math.random()
			.toString(36)
			.substr(2, 9)}`;
		const newMessage: ChatMessage = {
			id: messageId,
			text,
			sender,
			timestamp: new Date(),
			model,
		};
		setChatMessages((prev) => new Map(prev.set(messageId, newMessage)));
		setMessageOrder((prev) => [...prev, messageId]);
	};

	// Helper to speak only if not muted
	const speakIfAllowed = (text: string) => {
		if (voiceSelected && !isVoiceMuted) {
			speakText(text);
		}
	};

	// Auto-scroll to bottom of chat
	const scrollToBottom = () => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop =
				chatContainerRef.current.scrollHeight;
		}
	};

	// Scroll to bottom when new messages are added
	useEffect(() => {
		scrollToBottom();
	}, [messageOrder]);

	// Start diagnostic session
	const startDiagnosticSession = async () => {
		try {
			setIsLoading(true);
			const newSessionId = `session_${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}`;
			setSessionId(newSessionId);

			const response = await startDiagnostic(newSessionId);

			if (response.question) {
				const question: DiagnosticQuestion = {
					question: response.question,
					index: response.index,
					complete: response.complete,
				};
				setCurrentQuestion(question);

				// Add first question to chat
				addMessage(response.question, "ai");

				// Speak the question if voice mode is selected and not muted
				speakIfAllowed(response.question);
			}
		} catch (error) {
			console.error("Error starting diagnostic:", error);
			addMessage(
				"Sorry, I encountered an error starting the diagnostic. Please try again.",
				"ai"
			);
		} finally {
			setIsLoading(false);
		}
	};

	// Answer diagnostic question
	// const handleAnswerQuestion = async (answer: boolean) => {
	// 	if (!sessionId || !currentQuestion) return;

	// 	try {
	// 		setIsLoading(true);

	// 		// Add user answer to chat
	// 		addMessage(answer ? "Yes" : "No", "user");

	// 		const response = await answerDiagnosticQuestion(sessionId, answer);

	// 		if (response.complete && response.recommendation) {
	// 			// Diagnostic complete - show recommendation
	// 			setRecommendation(response.recommendation);
	// 			setDiagnosticComplete(true);
	// 			setCurrentQuestion(null);

	// 			const recommendationText = `${response.recommendation.reasoning}`;
	// 			addMessage(recommendationText, "ai");

	// 			speakIfAllowed(recommendationText);
	// 		} else if (response.next_question) {
	// 			// Continue with next question
	// 			setCurrentQuestion(response.next_question);

	// 			addMessage(response.next_question.question, "ai");

	// 			speakIfAllowed(response.next_question.question);
	// 		}
	// 	} catch (error) {
	// 		console.error("Error answering question:", error);
	// 		addMessage(
	// 			"Sorry, I encountered an error processing your answer. Please try again.",
	// 			"ai"
	// 		);
	// 	} finally {
	// 		setIsLoading(false);
	// 	}
	// };

	// Reset diagnostic
	const resetDiagnostic = () => {
		setSessionId("");
		setCurrentQuestion(null);
		setRecommendation(null);
		setDiagnosticComplete(false);
		setShowInitialGreeting(true);
		setDiagnosticStarted(false);
		setChatMessages(new Map());
		setMessageOrder([]);
	};

	// Load initial greeting
	const loadInitialGreeting = async () => {
		try {
			const response = await getGreeting();
			addMessage(response.greeting, "ai");

			speakIfAllowed(response.greeting);
		} catch (error) {
			console.error("Error loading greeting:", error);
			addMessage(
				"Hello! I'm RouteThis — your router troubleshooter. How can I help?",
				"ai"
			);
		}
	};

	// Handle initial user response to greeting
	const handleInitialInput = async () => {
		const messageText = userInput.trim();
		if (!messageText || !showInitialGreeting) return;

		try {
			setIsLoading(true);

			// Add user message to chat
			addMessage(messageText, "user");
			setUserInput("");

			const newSessionId =
				sessionId ||
				`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			if (!sessionId) setSessionId(newSessionId);

			// Handle initial response
			const response = await handleInitialResponse(messageText, newSessionId);

			// Add AI response
			addMessage(response.response, "ai");

			speakIfAllowed(response.response);

			// Check if we should start diagnostic
			if (response.start_diagnostic && response.first_question) {
				setShowInitialGreeting(false);
				setDiagnosticStarted(true);

				const question: DiagnosticQuestion = {
					question: response.first_question.question,
					index: response.first_question.index,
					complete: response.first_question.complete,
				};
				setCurrentQuestion(question);

				// Add first diagnostic question
				addMessage(response.first_question.question, "ai");

				speakIfAllowed(response.first_question.question);
			} else {
				// Stay in initial greeting mode if not router-related
				setShowInitialGreeting(true);
			}
		} catch (error) {
			console.error("Error processing initial input:", error);
			addMessage("Sorry, I encountered an error. Please try again.", "ai");
		} finally {
			setIsLoading(false);
		}
	};

	// Process user input for diagnostic questions
	const handleDiagnosticInput = async () => {
		const messageText = userInput.trim();
		if (!messageText || !currentQuestion || diagnosticComplete) return;

		try {
			setIsLoading(true);

			// Add user message to chat
			addMessage(messageText, "user");
			setUserInput("");

			// First check if the response is related to the current question or router troubleshooting
			const scopeCheckPrompt = `The user was asked: "${currentQuestion.question}". They responded: "${messageText}". Is this response attempting to answer the question or at least related to router troubleshooting? Reply with only "YES" or "NO".`;
			const scopeResponse = await sendMessage(scopeCheckPrompt);

			const isOnTopic = scopeResponse.reply.toLowerCase().includes("yes");

			if (!isOnTopic) {
				// User went off-topic, redirect them back to the question
				// Use the raw question without conversational intro to avoid confusion
				const rawQuestion =
					(currentQuestion as any).raw_question || currentQuestion.question;
				const redirectMessage = `Let's focus on the troubleshooting question, please. ${rawQuestion}`;
				addMessage(redirectMessage, "ai");

				speakIfAllowed(redirectMessage);
				return;
			}

			// Use GPT to determine if input means yes or no
			const yesNoPrompt = `The user was asked: "${currentQuestion.question}". They responded: "${messageText}". Does their response mean YES, NO, or are they unsure? Reply with "YES" or "NO" or "?" if unsure`;
      const yesNoResponse = await sendMessage(yesNoPrompt);
			console.log(yesNoResponse)
      



			// Parse GPT response
			// const isYes = yesNoResponse.reply.toLowerCase().includes("yes");
      const isYes = yesNoResponse.reply

			// Continue with diagnostic flow
			const response = await answerDiagnosticQuestion(sessionId, isYes);

			if (response.complete && response.recommendation) {
				// Diagnostic complete - show recommendation
				setRecommendation(response.recommendation);
				setDiagnosticComplete(true);
				setCurrentQuestion(null);

				const recommendationText = `${response.recommendation.reasoning}`;
				addMessage(recommendationText, "ai");

				speakIfAllowed(recommendationText);
		if (recommendationText.includes("recommend restarting your router")){
	const restartInstructions = `Please restart your router using the following steps:
1. Unplug the Power
2. Wait 30 Seconds
3. Plug It Back In (wait 1 to 3 minutes)
4. Check the Lights`;
      				addMessage(restartInstructions, "ai");

    }
			} else if (response.next_question) {
				// Continue with next question
				setCurrentQuestion(response.next_question);

				addMessage(response.next_question.question, "ai");

				speakIfAllowed(response.next_question.question);
			}
		} catch (error) {
			console.error("Error processing diagnostic input:", error);
			addMessage(
				"Sorry, I encountered an error processing your answer. Please try again.",
				"ai"
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleUserInput = () => {
		if (showInitialGreeting) {
			handleInitialInput();
		} else {
			handleDiagnosticInput();
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleUserInput();
		}
	};

	const handleMicClick = () => {
		if (!isSupported) {
			alert("Speech recognition is not supported in your browser");
			return;
		}

		if (isListening) {
			stopListening();
		} else {
			startListening();
		}
	};

	useEffect(() => {
		// Subscribe to voice activity changes
		const unsubscribe = voiceService.onActivityChange((isActive, amplitude) => {
			setIsVoiceActive(isActive);
			setVoiceAmplitude(amplitude ?? 0.5);
		});

		return unsubscribe;
	}, []);

	useEffect(() => {
		// Update user input when speech recognition transcript changes
		if (transcript) {
			setUserInput(transcript);
			resetTranscript();
		}
	}, [transcript, resetTranscript]);

	useEffect(() => {
		if (hasPlayedRef.current) return;

		console.log("Home component mounted");
		const timer = setTimeout(() => {
			console.log("Loading initial greeting after 4 seconds");
			loadInitialGreeting();
			hasPlayedRef.current = true;
		}, 4000);

		return () => clearTimeout(timer);
	}, [voiceSelected]);

	return (
		<div className="Home">
			<Splash />
			<div className="topHeader">
				<img
					src="/RT/RouteThis_logo_wht.png"
					alt="RouteThis Logo"
					className="logo"
				/>
				<div className="logoText">RouteThis</div>
				<div className="header-icons">
					<button
						className={`icon-button ${chatSelected ? "active" : ""}`}
						onClick={() => {
							setChatSelected(true);
							setVoiceSelected(false);
						}}
						title="Chat Mode"
					>
						<IoChatbubbleEllipsesOutline />
					</button>
					<button
						className={`icon-button ${voiceSelected ? "active" : ""}`}
						onClick={() => {
							setVoiceSelected(true);
							setChatSelected(false);
						}}
						title="Voice Mode"
					>
						<IoMicOutline />
					</button>
					<button
						className={`icon-button speaker-button ${
							isVoiceMuted ? "muted" : ""
						}`}
						onClick={() => setIsVoiceMuted((m) => !m)}
						title={isVoiceMuted ? "Unmute Voice" : "Mute Voice"}
						style={{ marginLeft: "8px" }}
					>
						{/* Speaker SVG icon, muted/unmuted */}
						{isVoiceMuted ? (
							<svg
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M9 9v6h4l5 5V5l-5 5H9z" />
								<line x1="1" y1="1" x2="23" y2="23" />
							</svg>
						) : (
							<svg
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M9 9v6h4l5 5V5l-5 5H9z" />
							</svg>
						)}
					</button>
				</div>
			</div>
			<div className="middleContent">
				{voiceSelected && (
					<div className="enabledVoiceMode">
						<VoiceVisualizer
							isActive={isVoiceActive}
							amplitude={voiceAmplitude}
							className="main-visualizer"
							isLoading={isLoading}
						/>
					</div>
				)}

				{chatSelected && (
					<div className="enabledChatMode">
						<div className="chat-container" ref={chatContainerRef}>
							<div className="chat-messages">
								{messageOrder.map((messageId) => {
									const message = chatMessages.get(messageId);
									if (!message) return null;

									return (
										<div
											key={message.id}
											className={`message ${
												message.sender === "user"
													? "user-message"
													: "ai-message"
											}`}
										>
											<div className="message-content">
												<div className="message-text">{message.text}</div>
												<div className="message-meta">
													<span className="message-time">
														{message.timestamp.toLocaleTimeString([], {
															hour: "2-digit",
															minute: "2-digit",
														})}
													</span>
													{message.model && (
														<span className="message-model">
															• {message.model}
														</span>
													)}
												</div>
											</div>
										</div>
									);
								})}

								{isLoading && (
									<div className="message ai-message">
										<div className="message-content">
											<div className="typing-indicator">
												<span></span>
												<span></span>
												<span></span>
											</div>
										</div>
									</div>
								)}
							</div>

							{messageOrder.length === 0 && !isLoading && (
								<div className="chat-empty-state">
									<div className="empty-state-content">
										<h3>Welcome to RouteThis Diagnostic</h3>
										<p>
											I'll help diagnose your network issues by asking a series
											of questions. Please answer with Yes or No.
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
			<div className="bottomNav">
				{(showInitialGreeting ||
					(diagnosticStarted && currentQuestion && !diagnosticComplete)) && (
					<div className="chat-input-container">
						<div className="input-wrapper">
							<input
								type="text"
								className="chat-input"
								placeholder={
									showInitialGreeting
										? "Describe your internet issue..."
										: "Type your answer..."
								}
								value={userInput}
								onChange={(e) => setUserInput(e.target.value)}
								onKeyPress={handleKeyPress}
								disabled={isLoading}
							/>
							<button
								className="send-button"
								onClick={handleUserInput}
								disabled={!userInput.trim() || isLoading}
							>
								<IoIosSend />
							</button>
						</div>
						<button
							className={`mic-button ${isListening ? "listening" : ""}`}
							onClick={handleMicClick}
						>
							<IoMicOutline />
						</button>
					</div>
				)}

				{diagnosticComplete && (
					<div className="diagnostic-complete-controls">
						<button
							className="new-conversation-button"
							onClick={resetDiagnostic}
						>
							Start New Conversation
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
