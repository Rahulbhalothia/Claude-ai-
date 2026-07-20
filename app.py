import os
import json
import requests
from dotenv import load_dotenv
from flask import Flask, request, render_template, Response, stream_with_context

load_dotenv()  # .env file se environment variables load karta hai

app = Flask(__name__)

# ---- CONFIG ----
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Frontend se messages array leta hai aur Groq API ko
    stream karke forward karta hai (OpenAI-compatible SSE format).
    """
    data = request.get_json(force=True)
    user_messages = data.get("messages", [])
    system_prompt = data.get("system", "You are a helpful assistant.")

    if not GROQ_API_KEY:
        return {"error": "GROQ_API_KEY environment variable set nahi hai."}, 500

    # Groq OpenAI-style format expects system prompt as first message
    full_messages = [{"role": "system", "content": system_prompt}] + user_messages

    payload = {
        "model": MODEL,
        "messages": full_messages,
        "stream": True,
        "max_tokens": 4096,
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "content-type": "application/json",
    }

    def generate():
        with requests.post(GROQ_API_URL, headers=headers,
                            json=payload, stream=True) as resp:
            if resp.status_code != 200:
                err_text = resp.text
                yield f"data: {json.dumps({'error': err_text})}\n\n"
                return

            for line in resp.iter_lines():
                if not line:
                    continue
                decoded = line.decode("utf-8")
                if decoded.startswith("data:"):
                    raw = decoded[len("data:"):].strip()
                    if raw == "[DONE]":
                        yield "data: [DONE]\n\n"
                        break
                    try:
                        event = json.loads(raw)
                    except json.JSONDecodeError:
                        continue

                    choices = event.get("choices", [])
                    if choices:
                        delta = choices[0].get("delta", {})
                        text_piece = delta.get("content", "")
                        if text_piece:
                            yield f"data: {json.dumps({'text': text_piece})}\n\n"
                        if choices[0].get("finish_reason"):
                            yield "data: [DONE]\n\n"
                            break

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
