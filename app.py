
from flask import Flask, render_template, request, jsonify
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import re

# ==========================================
# SETUP
# ==========================================

load_dotenv()

app = Flask(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY was not found in .env")
    client = None
else:
    print("Gemini API key loaded successfully.")
    client = genai.Client(api_key=GEMINI_API_KEY)


# Use a current Gemini Flash model
MODEL = "gemini-3.5-flash-lite"


# ==========================================
# MAMA'S LITTLE HELPER PROMPT
# ==========================================

SYSTEM_PROMPT = """
You are Mama's Little Helper, a supportive AI chatbot for new mothers
and caregivers of babies aged 1 to 12 months.

Your job is to provide simple, practical, reassuring and easy-to-understand
general information about babies and postpartum wellbeing.

You are NOT a doctor, nurse, midwife or healthcare professional.

Never diagnose a medical condition.

Never claim that a symptom is definitely harmless.

When something could be serious or urgent, clearly tell the parent to
seek professional medical care.

TOPICS YOU CAN HELP WITH:

- Breastfeeding
- Formula feeding
- Feeding routines
- Starting solids
- Baby sleep
- Baby crying
- Diapers
- Baby poop
- Constipation
- Bathing
- Baby skin
- Rashes
- Cradle cap
- Teething
- Tummy time
- Baby development
- General baby care
- Postpartum recovery
- Maternal wellbeing
- General parenting questions

AGE:

Always consider the baby's age.

If the baby's age is important and the user has not provided it,
ask for the baby's age.

SAFETY:

If the user describes a potentially serious emergency, do not diagnose.

Tell them to seek urgent medical attention.

Potential emergencies include:

- Difficulty breathing
- Not breathing
- Blue or grey lips or skin
- Seizure
- Unresponsiveness
- Severe bleeding
- Choking
- Serious injury
- Severe dehydration
- A baby who is unusually difficult to wake
- A rapidly worsening serious symptom

EMOTIONAL SUPPORT:

Be warm, calm and reassuring.

Never shame the parent.

Acknowledge their concern.

For example:

"I understand why that would worry you."

"You are doing the right thing by checking."

"Let's look at what you can do next."

ANSWER STYLE:

Keep answers short and easy to understand.

Use bullet points when useful.

Avoid unnecessary medical terminology.

Ask a useful follow-up question when needed.

For example:

"How old is your baby?"

"How long has this been happening?"

"Is your baby feeding normally?"

"Are they having normal wet diapers?"

IMPORTANT:

This chatbot provides general information only.

It does not replace advice from a qualified healthcare professional.
"""


# ==========================================
# CLEAN TEXT
# ==========================================

def clean_text(text):
    if not text:
        return ""

    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ==========================================
# URGENT SAFETY CHECK
# ==========================================

URGENT_TERMS = [
    "can't breathe",
    "cannot breathe",
    "not breathing",
    "difficulty breathing",
    "trouble breathing",
    "blue lips",
    "blue skin",
    "grey lips",
    "gray lips",
    "seizure",
    "unconscious",
    "unresponsive",
    "not waking",
    "won't wake",
    "severe bleeding",
    "heavy bleeding",
    "choking",
    "poison",
    "overdose"
]


def check_for_urgent_terms(message):

    message = clean_text(message.lower())

    for term in URGENT_TERMS:

        if term in message:
            return True

    return False


# ==========================================
# HOME PAGE
# ==========================================

@app.route("/")
def home():

    return render_template("index.html")


# ==========================================
# CHAT
# ==========================================

@app.route("/chat", methods=["POST"])
def chat():

    try:

        # Check Gemini connection
        if client is None:

            return jsonify({
                "error": "Gemini API key is missing. Please check your .env file."
            }), 500


        # Get data from website
        data = request.get_json()

        if not data:

            return jsonify({
                "error": "No message was received."
            }), 400


        message = data.get("message", "")

        message = clean_text(message)


        if not message:

            return jsonify({
                "error": "Please enter a question."
            }), 400


        print()
        print("========================================")
        print("USER QUESTION:")
        print(message)
        print("========================================")


        # ======================================
        # SAFETY CHECK
        # ======================================

        if check_for_urgent_terms(message):

            safety_message = """
I'm sorry you're dealing with this.

Because you mentioned something that could require urgent medical
attention, please do not rely on this chatbot for this situation.

Please contact emergency medical services or go to the nearest
emergency department, especially if your baby is having trouble
breathing, is unresponsive, has blue or grey skin or lips, is having
a seizure, is choking, or has severe bleeding.

Please seek professional medical help immediately.
"""

            return jsonify({
                "response": safety_message.strip()
            })


        # ======================================
        # SEND QUESTION TO GEMINI
        # ======================================

        print("Sending question to Gemini...")
        print("Model:", MODEL)


        response = client.models.generate_content(

            model=MODEL,

            contents=message,

            config=types.GenerateContentConfig(

                system_instruction=SYSTEM_PROMPT,

                max_output_tokens=300,

                temperature=0.4
            )
        )


        # ======================================
        # GET GEMINI RESPONSE
        # ======================================

        answer = response.text


        print("========================================")
        print("GEMINI ANSWER:")
        print(answer)
        print("========================================")


        # Make sure Gemini actually returned text

        if not answer:

            return jsonify({
                "error": "Gemini returned an empty response. Please try again."
            }), 500


        # ======================================
        # DISCLAIMER
        # ======================================

        disclaimer = (
            "\n\n"
            "Please remember: this information is for general guidance "
            "and does not replace advice from a qualified healthcare professional."
        )


        answer = answer.strip() + disclaimer


        print("Gemini response received.")


        # ======================================
        # SEND ANSWER TO WEBSITE
        # ======================================

        return jsonify({
            "response": answer
        })


    except Exception as error:

        print()
        print("========================================")
        print("GEMINI ERROR:")
        print(error)
        print("========================================")


        return jsonify({
            "error": "I'm sorry, I couldn't connect right now. Please try again."
        }), 500


# ==========================================
# START FLASK
# ==========================================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5050
    )

