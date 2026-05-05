from flask import Flask, render_template, request, jsonify
import os, json

app = Flask(__name__)

QUESTIONS_DIR = "questions"

@app.route("/")
def home():
    subjects = {}

    if os.path.exists(QUESTIONS_DIR):
        for subject in os.listdir(QUESTIONS_DIR):
            path = os.path.join(QUESTIONS_DIR, subject)
            if os.path.isdir(path):
                files = [f for f in os.listdir(path) if f.endswith(".json")]
                subjects[subject] = files

    return render_template("index.html", subjects=subjects)


@app.route("/get_questions")
def get_questions():
    subject = request.args.get("subject")
    file = request.args.get("file")

    if not subject or not file:
        return jsonify({"error": "Missing subject or file"}), 400

    path = os.path.join(QUESTIONS_DIR, subject, file)

    if not os.path.exists(path):
        return jsonify({"error": "File not found"}), 404

    with open(path, "r", encoding="utf-8") as f:
        return jsonify(json.load(f))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)