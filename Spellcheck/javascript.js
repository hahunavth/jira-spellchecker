var wordSuggestions = []; //  lưu trữ danh sách gợi ý
document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("keydown", function (event) {
    // Check if the pressed key is Enter or Space
    if (event.key === "Enter" || event.key === " ") {
      var paragraph = document.getElementById("text");
      var words = paragraph.innerText.trim().split(/\s+/);
      
      for (var i = 0; i < words.length; i++) {
        var word = words[i];

        var suggestions = getSuggestedWords(word); // Lấy danh sách từ gợi ý cho từ
        if (suggestions.length > 0) {
          wordSuggestions.push([word.toLowerCase(), suggestions]);
          wordSuggestions[word.toLowerCase()] = getSuggestedWords(word); // Lưu danh sách từ gợi ý cho từng từ
          if (wordSuggestions[word.toLowerCase()].length > 0) {
            words[i] =
              "<span class='error' onclick='showPopup(this)'>" +
              word +
              "</span>";
          }
          
        } 
      }
      console.log(paragraph)
      paragraph.innerHTML = words.join(" ");
      setCursorToEnd(paragraph);
    }
  });


  document.addEventListener("paste", function (event) {
    
    event.preventDefault();
    
    var paragraph = document.getElementById("text");
    var pastedText = (event.clipboardData || window.clipboardData).getData("text");
    paragraph.appendChild(document.createTextNode(pastedText));
    
    var words = paragraph.innerText.trim().split(/\s+/);

    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var suggestions = getSuggestedWords(word); // Lấy danh sách từ gợi ý cho t
      if (suggestions.length > 0) {
        wordSuggestions.push([word.toLowerCase(), suggestions]);
        wordSuggestions[word.toLowerCase()] = getSuggestedWords(word); // Lưu danh sách từ gợi ý cho từng từ
        if (wordSuggestions[word.toLowerCase()].length > 0) {
          words[i] =
            "<span class='error' onclick='showPopup(this)'>" +
            word +
            "</span>";
        }
      } 
    }
    paragraph.innerHTML = words.join(" ");
    setCursorToEnd(paragraph);
  });
});




function setCursorToEnd(paragraph) {
  var range = document.createRange();
  range.selectNodeContents(paragraph);
  range.collapse(false); // Đặt lựa chọn về cuối
  var selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function checkWordSpelling(word) {
  var is_spelled_correctly = dictionary.check(word);

  if (!is_spelled_correctly && /^[a-zA-Z]+$/.test(word)) {
    var suggestions = getSuggestedWords(word); // Lấy danh sách từ gợi ý cho từ
    if (suggestions.length > 0) {
      wordSuggestions.push([word.toLowerCase(), suggestions]);
      var span = document.createElement("span");
      span.className = "error";
      span.textContent = word;

      span.setAttribute("onclick", "showPopup(this)");

      var paragraph = document.getElementById("text");
      paragraph.normalize(); // Chuẩn hóa các nút văn bản trong đoạn văn bản

      var textContent = paragraph.textContent;
      var index = textContent.indexOf(word);

      if (index !== -1) {
        var beforeText = textContent.substring(0, index);
        var afterText = textContent.substring(index + word.length);
        paragraph.textContent = beforeText; // Xóa nội dung hiện tại của paragraph
        paragraph.appendChild(span); // Thêm phần tử span vào paragraph
        paragraph.appendChild(document.createTextNode(afterText)); // Thêm nội dung sau từ vào paragraph
      }

      setCursorToEnd(paragraph);
      console.log(wordSuggestions); // Lưu danh sách từ gợi ý cho từng từ
    }
  }
}

const dictionary = new Typo("en_US", null, null, {
  dictionaryPath: "./assets/dictionaries",
});

dictionary.alphabet = "abcdefghijklmnopqrstuvwxyz"; // NOTE: hotfix case suggest 'mismismismist' (ist -> 1st)

function getSuggestedWords(word) {
  const isCorrect = dictionary.check(word);
  // console.log(word, isCorrect, dictionary.suggest(word).map(w => w.toLowerCase().trim()))
  if (!isCorrect)
    return dictionary.suggest(word).map((w) => w.toLowerCase().trim());
  else return [];
}
// function showPopup(element) {
//   console.log(wordSuggestions)
//   const popupElement = document.querySelector(".popup");
//   const rect = element.getBoundingClientRect();
//   const top = rect.top + window.pageYOffset;
//   const left = rect.left + window.pageXOffset;

//   popupElement.style.top = `${top + element.offsetHeight}px`;
//   popupElement.style.left = `${left}px`;

//   currentIndex = 0; // Reset currentIndex khi mở popup
//   var word = element.innerText.toLowerCase();
//   console.log(word)
//   var suggestedWords = wordSuggestions[word]; // Lấy danh sách từ gợi ý cho từ hiện tại
//   console.log(wordSuggestions[word])
//   var popup = document.getElementById("popup");
//   popup.innerHTML = ""; // Clear previous content

//   popup.innerHTML += `

//     <div class="popup-content">
//     <span class='close-btn' onclick='closePopup()'><i class='fas fa-times'></i></span>
//       <b>Did you mean:</b>
//       <ul>
//         <li class="suggested-words" onclick='replaceWord(this, "${element.innerText.toLowerCase()}")'>${
//     suggestedWords[currentIndex]
//   }</li>
//       </ul>
//       <div class='popup-control'>
//       <div class='popup--control__left'>
//       <span class='currentIndex'>${currentIndex + 1}/${
//     suggestedWords.length
//   }</span>
//       <span class='navigation' onclick='prevWord()'><i class='fas fa-chevron-left'></i></span>
//       <span class='navigation' onclick='nextWord()'><i class='fas fa-chevron-right'></i></span>
//       </div>
//       <div class='popup--control__right'>
//       <button class ='ignoreBtn' onclick='ignoreBtn(this, "${element.innerText.toLowerCase()}")'>Ignore</button>
//       <button class ='confirmBtn' onclick='confirmBtn(this, "${element.innerText.toLowerCase()}")'>Confirm</button>
//       </div>
//       </div>

//     </div>`;

//   popup.style.display = "block";
//   popup.suggestedWords = suggestedWords;
// }
function showPopup(element) {
  const popupElement = document.querySelector(".popup");
  const rect = element.getBoundingClientRect();
  const top = rect.top + window.pageYOffset;
  const left = rect.left + window.pageXOffset;

  popupElement.style.top = `${top + element.offsetHeight}px`;
  popupElement.style.left = `${left}px`;

  currentIndex = 0; // Reset currentIndex khi mở popup
  // var word = element.innerText.toLowerCase();
  var word = String(element.innerText).toLowerCase();

  var wordIndex = -1;
 
  for (var i = 0; i < wordSuggestions.length; i++) {
    
    var suggestion = wordSuggestions[i][0].trim().toLowerCase(); // Loại bỏ khoảng trắng và chuyển đổi sang chữ thường
    var word = String(element.innerText).trim().toLowerCase(); // Loại bỏ khoảng trắng và chuyển đổi sang chữ thường
   
    if (suggestion === word) {
      wordIndex = i;
     
      break;
    }
  }
  

  var suggestedWords = wordSuggestions[wordIndex][1];

  if (wordIndex !== -1) {
    var suggestedWords = wordSuggestions[wordIndex][1];

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
