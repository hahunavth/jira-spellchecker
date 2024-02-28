var wordSuggestions = {}; //  lưu trữ danh sách gợi ý
document.addEventListener("DOMContentLoaded", function () {
  var paragraph = document.getElementById("text");
  var words = paragraph.innerText.split(" ");
  for (var i = 0; i < words.length; i++) {
    var word = words[i];

    if (/^[a-zA-Z]+$/.test(word)) {
      wordSuggestions[word.toLowerCase()] = getSuggestedWords(word); // Lưu danh sách từ gợi ý cho từng từ
      if (wordSuggestions[word.toLowerCase()].length > 0) {
        words[i] =
          "<span class='error' onclick='showPopup(this)'>" + word + "</span>";
      }
    }
  }

  paragraph.innerHTML = words.join(" ");
});

document.addEventListener("DOMContentLoaded", function () {
  var paragraph = document.getElementById("text");

  paragraph.addEventListener("input", function() {
    var textContent = paragraph.innerText;
    var words = textContent.split(" ");
    var lastWord = words[words.length - 1]; // Lấy từ cuối cùng trong mảng từ
    console.log(lastWord)

    // Kiểm tra chính tả của từ cuối cùng
    checkWordSpelling(lastWord);
  });
});

function checkWordSpelling(word) { 
  
  var is_spelled_correctly = dictionary.check(word);
  

  if (!is_spelled_correctly && /^[a-zA-Z]+$/.test(word)) {
    wordSuggestions[word.toLowerCase()] = getSuggestedWords(word); // Lưu danh sách từ gợi ý cho từng từ
    console.log(wordSuggestions)
    if (wordSuggestions[word.toLowerCase()].length > 0) {
      
      var span = document.createElement("span");
      span.className = "error";
      span.textContent = word;
      console.log(span)
      
    span.setAttribute(
      "onclick",
      "showPopup(this)"
    );
      // word ="<span class='error' onclick='showPopup(this)'>" + word + "</span>";
      // console.log(word)
      
    //   word.setAttribute(
    //     "onclick",
    //     "showPopup(this)"
    //   );
    var paragraph = document.getElementById("text");
    paragraph.appendChild(span);

    }
  }
}


const dictionary = new Typo("en_US", null, null, { dictionaryPath: './assets/dictionaries' })
dictionary.alphabet = 'abcdefghijklmnopqrstuvwxyz' // NOTE: hotfix case suggest 'mismismismist' (ist -> 1st)

function getSuggestedWords(word) {
  const isCorrect = dictionary.check(word)
  // console.log(word, isCorrect, dictionary.suggest(word).map(w => w.toLowerCase().trim()))
  if(!isCorrect)
    return dictionary.suggest(word).map(w => w.toLowerCase().trim())
  else
    return []
}

function showPopup(element) {
  const popupElement = document.querySelector(".popup");
  const rect = element.getBoundingClientRect();
  const top = rect.top + window.pageYOffset;
  const left = rect.left + window.pageXOffset;

  popupElement.style.top = `${top + element.offsetHeight}px`;
  popupElement.style.left = `${left}px`;

  currentIndex = 0; // Reset currentIndex khi mở popup
  var word = element.innerText.toLowerCase();
  var suggestedWords = wordSuggestions[word]; // Lấy danh sách từ gợi ý cho từ hiện tại
  var popup = document.getElementById("popup");
  popup.innerHTML = ""; // Clear previous content

  popup.innerHTML += `
    
    <div class="popup-content">
    <span class='close-btn' onclick='closePopup()'><i class='fas fa-times'></i></span>
      <b>Did you mean:</b>
      <ul>
        <li class="suggested-words" onclick='replaceWord(this, "${element.innerText.toLowerCase()}")'>${
    suggestedWords[currentIndex]
  }</li>
      </ul>
      <div class='popup-control'>
      <div class='popup--control__left'>
      <span class='currentIndex'>${currentIndex + 1}/${
    suggestedWords.length
  }</span>
      <span class='navigation' onclick='prevWord()'><i class='fas fa-chevron-left'></i></span>
      <span class='navigation' onclick='nextWord()'><i class='fas fa-chevron-right'></i></span>
      </div>
      <div class='popup--control__right'>
      <button class ='ignoreBtn' onclick='ignoreBtn(this, "${element.innerText.toLowerCase()}")'>Ignore</button>
      <button class ='confirmBtn' onclick='confirmBtn(this, "${element.innerText.toLowerCase()}")'>Confirm</button>
      </div>
      </div>
      
    </div>`;

  popup.style.display = "block";
  popup.suggestedWords = suggestedWords;
}

function prevWord() {
  var popup = document.getElementById("popup");
  var suggestedWords = popup.suggestedWords;
  currentIndex =
    (currentIndex - 1 + suggestedWords.length) % suggestedWords.length;
  popup
    .getElementsByTagName("ul")[0]
    .getElementsByTagName("li")[0].textContent = suggestedWords[currentIndex];

  // Cập nhật currentIndex trong popup
  popup.querySelector(".currentIndex").textContent =
    currentIndex + 1 + "/" + suggestedWords.length;
}

function nextWord() {
  var popup = document.getElementById("popup");
  var suggestedWords = popup.suggestedWords;
  currentIndex = (currentIndex + 1) % suggestedWords.length;
  popup
    .getElementsByTagName("ul")[0]
    .getElementsByTagName("li")[0].textContent = suggestedWords[currentIndex];

  // Cập nhật currentIndex trong popup
  popup.querySelector(".currentIndex").textContent =
    currentIndex + 1 + "/" + suggestedWords.length;
}

function closePopup() {
  var popup = document.getElementById("popup");
  popup.style.display = "none";
}

function replaceWord(element, originalWord) {
  var currentWord = element.innerText.toLowerCase();
  var errorElements = document.querySelectorAll(".error");
  errorElements.forEach(function (errorElement) {
    if (errorElement.innerText.toLowerCase() === originalWord) {
      errorElement.innerText = currentWord;
      errorElement.classList.remove("error");
    }
  });

  closePopup();
}
function confirmBtn(element, originalWord) {
  var popup = document.getElementById("popup");
  var currentWord = popup
    .getElementsByTagName("ul")[0]
    .getElementsByTagName("li")[0].textContent;
  var errorElements = document.querySelectorAll(".error");
  errorElements.forEach(function (errorElement) {
    if (errorElement.innerText.toLowerCase() === originalWord) {
      errorElement.innerText = currentWord;
      errorElement.classList.remove("error");
    }
  });

  closePopup();
}
function ignoreBtn(element, originalWord) {
  var errorElements = document.querySelectorAll(".error");
  errorElements.forEach(function (errorElement) {
    if (errorElement.innerText.toLowerCase() === originalWord) {
      errorElement.classList.remove("error");
    }
  });

  closePopup();
}
