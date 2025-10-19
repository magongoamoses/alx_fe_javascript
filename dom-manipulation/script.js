// ---- Data structure ----
const quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Success is not in what you have, but who you are.", category: "Success" },
  { text: "Happiness depends upon ourselves.", category: "Happiness" },
];

//  ---- DOM references ----
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categorySelect = document.getElementById("categorySelect");
const addQuoteContainer = document.getElementById("addQuoteContainer");

// ---- Initialize App ----
document.addEventListener("DOMContentLoaded", () => {
  populateCategoryDropdown();
  showRandomQuote();
  createAddQuoteForm();
});

// ---- Populate categoty dropdown ----
function populateCategoryDropdown() {

  // Get categories from quotes array
  const categories = [...new Set(quotes.map(q => q.category))];
  
  // Clear old options
  categorySelect.innerHTML = "";

  // Add "All" option
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All";
  categorySelect.appendChild(allOption);

  // Add categories
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// ---- Show random quote ----
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  let filteredQuotes = quotes;

  if (selectedCategory && selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  // ---- Animate text replacement ----
  quoteDisplay.style.opacity = 0;
  setTimeout(() => {
    quoteDisplay.textContent = `"${quote.text}" — ${quote.category}`;
    quoteDisplay.style.opacity = 1;
  }, 300);
}

// ---- Create Add Quote Form ----
function createAddQuoteForm() {
  const form = document.createElement("form");

  const quoteInput = document.createElement("input");
  quoteInput.type = "text";
  quoteInput.id = "newQuoteText";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.type = "submit";

  form.append(quoteInput, categoryInput, addButton);
  addQuoteContainer.appendChild(form);

  // Handle form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addQuote(quoteInput.value.trim(), categoryInput.value.trim());
    quoteInput.value = "";
    categoryInput.value = "";
  });
}

// ---- Add Quote ----
function addQuote(text, category) {
  if (!text || !category) {
    alert("Please fill in both fields!");
    return;
  }

  // Add new quote to array
  quotes.push({ text, category });

  // Update category dropdown
  populateCategoryDropdown();

  // Show a confirmation 
  const confirmation = document.createElement("p");
  confirmation.textContent = "✅ New quote added!";
  confirmation.style.color = "green";
  addQuoteContainer.appendChild(confirmation);

  setTimeout(() => confirmation.remove(), 2000);
}

// ---- Event Listeners ----
newQuoteBtn.addEventListener("click", showRandomQuote);
categorySelect.addEventListener("change", showRandomQuote);
