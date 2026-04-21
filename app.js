document.addEventListener('DOMContentLoaded', () => {
    const flashcard = document.getElementById('flashcard');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnRandom = document.getElementById('btn-random');
    
    // UI Elements
    const elCategory = document.getElementById('front-category');
    const elGerman = document.getElementById('german-word');
    const elVariation = document.getElementById('word-variation');
    const elChinese = document.getElementById('chinese-meaning');
    const elEnglish = document.getElementById('english-meaning');
    const elTaiwanese = document.getElementById('taiwanese-meaning');
    const elTaiwaneseGroup = document.getElementById('taiwanese-group');
    const elTotal = document.getElementById('total-count');
    const elLearned = document.getElementById('learned-count');
    const progressBar = document.getElementById('progress-bar');

    let vocabData = [];
    let currentIndex = 0;
    let isFlipped = false;

    // Fetch data
    fetch('vocab.json')
        .then(res => res.json())
        .then(data => {
            vocabData = processData(data);
            elTotal.textContent = vocabData.length;
            if(vocabData.length > 0) {
                showCard(0);
            }
        })
        .catch(err => {
            console.error(err);
            elGerman.textContent = "Error loading data.";
        });

    function cleanString(val) {
        if(!val || val.toLowerCase() === 'nan' || val.toLowerCase() === 'none') {
            return '';
        }
        return val.trim();
    }

    function processData(data) {
        return data.map(item => ({
            word: cleanString(item['單字']),
            variation: cleanString(item['單字及詞形變化']),
            category: cleanString(item['類別']) || cleanString(item['次類別']),
            chinese: cleanString(item['中文釋義']),
            english: cleanString(item['英文釋義']),
            taiwanese: cleanString(item['台文釋義'])
        })).filter(item => item.word.length > 0);
    }

    function showCard(index) {
        if(isFlipped) {
            flashcard.classList.remove('is-flipped');
            isFlipped = false;
            // Wait for flip animation before updating content
            setTimeout(() => {
                updateContent(index);
            }, 300);
        } else {
            updateContent(index);
        }
    }

    function updateContent(index) {
        const item = vocabData[index];
        elGerman.textContent = item.word;
        elCategory.textContent = item.category;
        
        if (item.variation && item.variation !== item.word) {
            elVariation.textContent = item.variation;
        } else {
            elVariation.textContent = '';
        }

        elChinese.textContent = item.chinese || 'N/A';
        elEnglish.textContent = item.english || 'N/A';

        if (item.taiwanese) {
            elTaiwanese.textContent = item.taiwanese;
            elTaiwaneseGroup.style.display = 'block';
        } else {
            elTaiwaneseGroup.style.display = 'none';
        }

        currentIndex = index;
        elLearned.textContent = currentIndex + 1;
        updateProgress();
    }

    function updateProgress() {
        const percent = ((currentIndex + 1) / vocabData.length) * 100;
        progressBar.style.width = `${percent}%`;
    }

    // Event Listeners
    flashcard.addEventListener('click', () => {
        isFlipped = !isFlipped;
        flashcard.classList.toggle('is-flipped');
    });

    btnNext.addEventListener('click', (e) => {
        e.stopPropagation();
        const nextIdx = (currentIndex + 1) % vocabData.length;
        showCard(nextIdx);
    });

    btnPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        const prevIdx = (currentIndex - 1 + vocabData.length) % vocabData.length;
        showCard(prevIdx);
    });

    btnRandom.addEventListener('click', (e) => {
        e.stopPropagation();
        const randomIdx = Math.floor(Math.random() * vocabData.length);
        showCard(randomIdx);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            isFlipped = !isFlipped;
            flashcard.classList.toggle('is-flipped');
        } else if (e.code === 'ArrowRight') {
            btnNext.click();
        } else if (e.code === 'ArrowLeft') {
            btnPrev.click();
        }
    });
});
