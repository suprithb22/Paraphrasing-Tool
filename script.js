document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const wordCount = document.getElementById('word-count');
    const charCount = document.getElementById('char-count');
    const toneButtons = document.querySelectorAll('.mode-btn');
    const paraphraseBtn = document.getElementById('paraphrase-btn');
    const outputText = document.getElementById('output-text');
    const copyBtn = document.getElementById('copy-btn');
    const listenBtn = document.getElementById('listen-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const clearBtn = document.getElementById('clear-btn');
    const loader = document.getElementById('loader');
    const toast = document.getElementById('toast');

    let currentTone = 'default';

    // Text stats logic
    const updateStats = () => {
        const text = inputText.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;

        charCount.textContent = chars;
        wordCount.textContent = words;

        paraphraseBtn.disabled = chars === 0;
    };

    inputText.addEventListener('input', updateStats);

    // Initial check
    updateStats();

    // Tone selection logic
    toneButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toneButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTone = btn.dataset.tone;
        });
    });

    // Toolbar buttons
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputText.value = text;
            updateStats();
        } catch (err) {
            console.error('Failed to read clipboard', err);
            // Fallback instruction
            alert("Clipboard access denied or not supported. Try Ctrl+V.");
        }
    });

    clearBtn.addEventListener('click', () => {
        inputText.value = '';
        outputText.textContent = 'Input your text into this box to see it rephrased...';
        outputText.classList.add('placeholder');
        outputText.classList.remove('error-text');
        copyBtn.disabled = true;
        listenBtn.disabled = true;
        updateStats();
    });

    // Paraphrase API call
    paraphraseBtn.addEventListener('click', async () => {
        const text = inputText.value.trim();
        if (!text) return;

        // UI Loading state
        paraphraseBtn.disabled = true;
        loader.classList.add('active');
        copyBtn.disabled = true;
        listenBtn.disabled = true;

        try {
            const response = await fetch('/api/paraphrase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    tone: currentTone
                })
            });

            const data = await response.json();

            if (data.success) {
                outputText.textContent = data.result;
                outputText.classList.remove('placeholder', 'error-text');
                copyBtn.disabled = false;
                listenBtn.disabled = false;
            } else {
                outputText.textContent = `Error: ${data.error}`;
                outputText.classList.remove('placeholder');
                outputText.classList.add('error-text');
                copyBtn.disabled = true;
                listenBtn.disabled = true;
            }
        } catch (error) {
            outputText.textContent = `Error: Failed to connect to the server.`;
            outputText.classList.remove('placeholder');
            outputText.classList.add('error-text');
            copyBtn.disabled = true;
            listenBtn.disabled = true;
        } finally {
            // Re-enable if there is still input text
            paraphraseBtn.disabled = inputText.value.trim().length === 0;
            loader.classList.remove('active');
        }
    });

    // Copy to clipboard logic
    copyBtn.addEventListener('click', async () => {
        const textToCopy = outputText.textContent;
        if (!textToCopy || outputText.classList.contains('placeholder') || outputText.classList.contains('error-text')) {
            return;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            showToast();
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast();
            } catch (e) { }
            document.body.removeChild(textArea);
        }
    });

    // Listen API Logic (TTS)
    listenBtn.addEventListener('click', () => {
        const textToSpeak = outputText.textContent;
        if (!textToSpeak || outputText.classList.contains('placeholder') || outputText.classList.contains('error-text')) {
            return;
        }

        // Stop currently playing
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        window.speechSynthesis.speak(utterance);
    });

    function showToast() {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
