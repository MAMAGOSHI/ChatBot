
// ==========================================
// MAMA'S LITTLE HELPER
// CHAT JAVASCRIPT
// ==========================================


// ==========================================
// GET HTML ELEMENTS
// ==========================================

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");

const babyAge = document.getElementById("babyAge");
const ageDisplay = document.getElementById("ageDisplay");

const typingIndicator = document.getElementById("typingIndicator");

const clearChat = document.getElementById("clearChat");


// ==========================================
// BABY AGE
// ==========================================

babyAge.addEventListener("change", function () {

    const selectedAge = babyAge.value;

    if (selectedAge) {

        ageDisplay.textContent = "Baby age: " + selectedAge;

    } else {

        ageDisplay.textContent = "Baby age not selected";

    }

});


// ==========================================
// ADD MESSAGE TO CHAT
// ==========================================

function addMessage(message, sender) {

    const messageDiv = document.createElement("div");

    messageDiv.classList.add("message");

    if (sender === "user") {

        messageDiv.classList.add("user-message");

        messageDiv.innerHTML = `
            <div class="bubble">
                ${escapeHTML(message)}
            </div>
        `;

    } else {

        messageDiv.classList.add("bot-message");

        messageDiv.innerHTML = `
            <div class="avatar">
                M
            </div>

            <div class="bubble">
                ${formatBotMessage(message)}
            </div>
        `;
    }

    chatMessages.appendChild(messageDiv);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// ==========================================
// FORMAT BOT RESPONSE
// ==========================================

function formatBotMessage(message) {

    let safeMessage = escapeHTML(message);

    // Convert line breaks into HTML line breaks
    safeMessage = safeMessage.replace(/\n/g, "<br>");

    return `<p>${safeMessage}</p>`;
}


// ==========================================
// PROTECT AGAINST HTML IN USER TEXT
// ==========================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ==========================================
// SHOW TYPING INDICATOR
// ==========================================

function showTyping() {

    typingIndicator.hidden = false;

    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// ==========================================
// HIDE TYPING INDICATOR
// ==========================================

function hideTyping() {

    typingIndicator.hidden = true;
}


// ==========================================
// SEND MESSAGE TO FLASK
// ==========================================

async function sendMessage(message) {

    try {

        showTyping();

        const response = await fetch("/chat", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                message: message,

                baby_age: babyAge.value

            })

        });


        const data = await response.json();


        hideTyping();


        // ======================================
        // CHECK FOR SERVER ERROR
        // ======================================

        if (!response.ok) {

            addMessage(

                data.error ||
                "Something went wrong. Please try again.",

                "bot"

            );

            return;

        }


        // ======================================
        // DISPLAY GEMINI RESPONSE
        // ======================================

        if (data.response) {

            addMessage(data.response, "bot");

        } else {

            addMessage(

                "I received an empty response. Please try again.",

                "bot"

            );
        }


    } catch (error) {

        hideTyping();

        console.error("Chat error:", error);

        addMessage(

            "I'm sorry, I couldn't connect right now. Please try again.",

            "bot"

        );

    }

}


// ==========================================
// CHAT FORM SUBMIT
// ==========================================

chatForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const message = messageInput.value.trim();


    // Don't send empty messages
    if (!message) {

        return;

    }


    // Show user's message
    addMessage(message, "user");


    // Clear input
    messageInput.value = "";


    // Send to Flask
    await sendMessage(message);

});


// ==========================================
// QUICK QUESTION BUTTONS
// ==========================================

const quickChips = document.querySelectorAll(".quick-chip");


quickChips.forEach(function (button) {

    button.addEventListener("click", function () {

        const question = button.dataset.question;

        if (!question) {

            return;

        }

        addMessage(question, "user");

        sendMessage(question);

    });

});


// ==========================================
// NEW CHAT BUTTON
// ==========================================

clearChat.addEventListener("click", function () {

    chatMessages.innerHTML = `

        <div class="message bot-message">

            <div class="avatar">
                M
            </div>

            <div class="bubble">

                <p>
                    <strong>
                        Hi, Mama. 🤍
                    </strong>
                </p>

                <p>
                    I'm Mama's Little Helper.
                    I'm here to make those little
                    questions feel a little easier.
                </p>

                <p>
                    Choose a topic on the left,
                    or ask me anything about caring
                    for your baby aged 1–12 months.
                </p>

            </div>

        </div>

    `;

});


// ==========================================
// CATEGORY QUESTIONS
// ==========================================

const categoryButtons =
    document.querySelectorAll(".category-btn");

const categoryModal =
    document.getElementById("categoryModal");

const modalTitle =
    document.getElementById("modalTitle");

const modalQuestions =
    document.getElementById("modalQuestions");


const categoryQuestions = {

    "Feeding": [
        "How often should my baby feed?",
        "How do I know if my baby is getting enough milk?",
        "When can my baby start solid foods?"
    ],

    "Sleep": [
        "How much should my baby sleep?",
        "How can I help my baby sleep?",
        "What is a safe sleeping position for my baby?"
    ],

    "Crying & Soothing": [
        "Why is my baby crying so much?",
        "How can I soothe my crying baby?",
        "How do I know if my baby's crying needs medical attention?"
    ],

    "Diapers & Poop": [
        "How often should I change my baby's diaper?",
        "What should normal baby poop look like?",
        "What can I do if my baby is constipated?"
    ],

    "Bathing & Skin": [
        "How often should I bathe my baby?",
        "How do I care for my baby's skin?",
        "What can I do about cradle cap?"
    ],

    "Baby Development": [
        "What should my baby be learning at this age?",
        "How can I encourage tummy time?",
        "When should my baby start reaching for things?"
    ],

    "Postpartum Recovery": [
        "What should I expect during postpartum recovery?",
        "When should I contact a healthcare professional after giving birth?",
        "How can I look after myself after having a baby?"
    ],

    "Baby Safety": [
        "What are important safety tips for my baby?",
        "How can I make my baby's sleeping area safer?",
        "What should I do if my baby chokes?"
    ],

    "Mom's Wellbeing": [
        "I feel overwhelmed as a new mom. What can I do?",
        "How can I make time for myself?",
        "When should I ask someone for help?"
    ]

};


// ==========================================
// OPEN CATEGORY MODAL
// ==========================================

categoryButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const category = button.dataset.category;

        modalTitle.textContent = category;

        modalQuestions.innerHTML = "";


        const questions =
            categoryQuestions[category] || [];


        questions.forEach(function (question) {

            const questionButton =
                document.createElement("button");

            questionButton.classList.add("modal-question");

            questionButton.textContent = question;


            questionButton.addEventListener(
                "click",
                function () {

                    categoryModal.classList.add("hidden");

                    addMessage(question, "user");

                    sendMessage(question);

                }
            );


            modalQuestions.appendChild(questionButton);

        });


        categoryModal.classList.remove("hidden");

    });

});


// ==========================================
// CLOSE MODALS
// ==========================================

const closeButtons =
    document.querySelectorAll(".close-modal");


closeButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const modalId = button.dataset.close;

        const modal =
            document.getElementById(modalId);

        if (modal) {

            modal.classList.add("hidden");

        }

    });

});


// ==========================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ==========================================

window.addEventListener("click", function (event) {

    if (event.target.classList.contains("modal")) {

        event.target.classList.add("hidden");

    }

});


// ==========================================
// ENTER KEY
// ==========================================

messageInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        chatForm.requestSubmit();

    }

});

