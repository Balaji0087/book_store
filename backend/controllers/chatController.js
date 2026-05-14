import axios from 'axios';

export const handleChat = async (req, res) => {
    try {
        const userId = req.user?._id?.toString() || req.user?.id;
        let userMessage = req.body.message || "";
        userMessage = userMessage.trim();
        const chatHistory = req.body.history || [];

        if (!userId) {
            return res.status(401).json({ reply: "Please log in to chat and make orders." });
        }

        // Forward to Python FastMCP Chat Service
        const pythonResponse = await axios.post('https://book-store-mcp.onrender.com/chat', {
            message: userMessage,
            user_id: userId,
            role: req.user?.role || 'user',
            history: chatHistory
        });

        // The python service returns: { "response": { "answer": "...", "tool_used": "...", "data": ... } }
        let replyText = "No response from internal AI.";
        if (pythonResponse.data) {
            const resp = pythonResponse.data.response || pythonResponse.data;
            if (typeof resp === 'string') {
                replyText = resp;
            } else if (resp) {
                const toolResult = resp.data || resp;
                replyText = resp.answer || resp.message || toolResult?.message || replyText;

                if (!replyText || replyText === "No response from internal AI.") {
                    if (resp.answer === "" && toolResult?.message) {
                        replyText = toolResult.message;
                    }
                    if (!replyText && toolResult?.success && toolResult.order_id) {
                        replyText = `Order placed successfully. Your order ID is ${toolResult.order_id}.`;
                    }
                    if (!replyText && toolResult?.error) {
                        replyText = toolResult.error;
                    }
                }
            }
        }

        return res.json({ reply: replyText });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ reply: "Oh no! Something went wrong communicating with the MCP AI Assistant." });
    }
};
