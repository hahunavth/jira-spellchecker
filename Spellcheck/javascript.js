
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

function getSuggestedWords(word) {
  var dictionary = {
    sampl: ["sample", "simple", "sampled"],
    paragrap: ["paragraph", "parade", "parapet"],
  };
  return dictionary[word.toLowerCase()] || [];
}


function showPopup(element) {
    const popupElement = document.querySelector('.popup');
    const rect = element.getBoundingClientRect();
    const top = rect.top + window.pageYOffset;
    const left = rect.left + window.pageXOffset;
  
    popupElement.style.top = `${top + element.offsetHeight}px`;
    popupElement.style.left = `${left}px`;
  
    currentIndex = 0; // Reset currentIndex khi mở popup
    var word = element.innerText.toLowerCase();
    var suggestedWords = wordSuggestions[word]; // Lấy danh sách từ gợi ý cho từ hiện tại
    var popup = document.getElementById("popup");
    popup.innerHTML =
      "<span class='close-btn' onclick='closePopup()'>X</span><b>Did you mean:</b>";
    var ul = document.createElement("ul");
    var li = document.createElement("li");
  
    li.textContent = suggestedWords[currentIndex];
    li.setAttribute(
      "onclick",
      "replaceWord(this, '" + element.innerText.toLowerCase() + "')"
    );
    popup.innerHTML +=
      "<p class='wrongWord'> " + element.innerText + "</p>"; 
    ul.appendChild(li);
    popup.appendChild(ul);
  
    // Hiển thị currentIndex
    popup.innerHTML += "<span class='currentIndex'>" + (currentIndex + 1) + "/" + suggestedWords.length + "</span>";
  
    popup.innerHTML +=
      "<span class='navigation' onclick='prevWord()'> &lt; </span> <span class='navigation' onclick='nextWord()'> &gt; </span>";
    popup.innerHTML +=
      "<button class ='ignoreBtn' onclick='ignoreBtn(this, \"" +
      element.innerText.toLowerCase() +
      "\")'>ignore</button>";
    popup.innerHTML +=
      "<button class ='confirmBtn' onclick='confirmBtn(this, \"" +
      element.innerText.toLowerCase() +
      "\")'>Confirm</button>";
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
    popup.querySelector('.currentIndex').textContent = (currentIndex + 1) + "/" + suggestedWords.length;
  }
  
  function nextWord() {
    var popup = document.getElementById("popup");
    var suggestedWords = popup.suggestedWords;
    currentIndex = (currentIndex + 1) % suggestedWords.length;
    popup
      .getElementsByTagName("ul")[0]
      .getElementsByTagName("li")[0].textContent = suggestedWords[currentIndex];
  
    // Cập nhật currentIndex trong popup
    popup.querySelector('.currentIndex').textContent = (currentIndex + 1) + "/" + suggestedWords.length;
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