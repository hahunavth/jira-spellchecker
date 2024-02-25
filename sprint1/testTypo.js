var Typo = require("typo-js");
var dictionary = new Typo("en_US");


var is_spelled_correctly = dictionary.check("mispelled");
console.log(is_spelled_correctly)

var array_of_suggestions = dictionary.suggest("mispeling");
console.log(array_of_suggestions)
// RESULT: 
// [
//     'misspelling',
//     'dispelling',
//     'Dispelling',    # UPPERCASE FIRST LETTER? -> REQUIRE NORMALIZE!
//     'misdealing',
//     'misfiling'
//  ]

var array_of_suggestions = dictionary.suggest("mispelled");
console.log(array_of_suggestions)
// CORRECT WORD ALSO HAVE SUGGEST


const execTime = (fn, args) => {
    var startTime = performance.now()
    var result = fn(args)
    var endTime = performance.now()
    return { "result": result, "time": endTime - startTime }
}

// const words = [
//     "a", "missspell", "mispelled", "apple", "banana", "bananana", "snape"
// ]
const paragraph = "In academic writing, readers expect each paragraph to have a sentence or two that captures its main point. They’re often called “topic sentences,” though many writing instructors prefer to call them “key sentences.” There are at least two downsides of the phrase “topic sentence.” First, it makes it seem like the paramount job of that sentence is simply to announce the topic of the paragraph. Second, it makes it seem like the topic sentence must always be a single grammatical sentence. Calling it a “key sentence” reminds us that it expresses the central idea of the paragraph. And sometimes a question or a two-sentence construction functions as the key."
const words = paragraph.replace(",", " ").replace(".", " ").split(" ").filter(i => i)
console.log("N words: ", words.length)
const check = () => words.forEach(() => dictionary.check("mispelled"))
const suggest = () => words.forEach(() => dictionary.suggest("mispelled"))

const { time } = execTime(check)
console.log(time)   // 0.0703740119934082

const { time: time2 } = execTime(suggest)
console.log(time2)  // 0.05704498291015625


// CALL CHECK WITH A PHASE
var is_spelled_correctly = dictionary.check("mis pe l led");
console.log(is_spelled_correctly)  // False

var array_of_suggestions = dictionary.suggest("mi s p el ing");
console.log(array_of_suggestions)  // RETURN: []

var array_of_suggestions = dictionary.suggest("a apple");
console.log(array_of_suggestions)  // RETURN: [ ' apple', 'Dapple', ' dapple', ' Dapple', 'apple' ] -> NG