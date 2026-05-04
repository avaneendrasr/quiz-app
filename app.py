from flask import Flask, render_template, request, jsonify
import os
import json

app = Flask(__name__)

# Folder where JSON files are stored
QUESTIONS_DIR = "questions"


# HOME ROUTE
@app.route("/")
def home():
    try:
        files = [f for f in os.listdir(QUESTIONS_DIR) if f.endswith(".json")]
    except Exception:
        files = []
    return render_template("index.html", files=files)


# GET QUESTIONS
@app.route("/get_questions")
def get_questions():
    filename = request.args.get("file")

    # Validate filename
    if not filename:
        return jsonify({"error": "No file provided"}), 400

    # Prevent path traversal (security)
    if ".." in filename or filename.startswith("/"):
        return jsonify({"error": "Invalid filename"}), 400

    path = os.path.join(QUESTIONS_DIR, filename)

    # Check file exists
    if not os.path.exists(path):
        return jsonify({"error": "File not found"}), 404

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": "Failed to read file", "details": str(e)}), 500


# RUN SERVER
if __name__ == "__main__":
    # Required for Render deployment
    app.run(host="0.0.0.0", port=5000)