// --- DOM elements ---
const randomBtn = document.getElementById("random-btn");
const recipeDisplay = document.getElementById("recipe-display");
const remixBtn = document.getElementById("remix-btn");
const remixThemeSelect = document.getElementById("remix-theme");
const remixOutput = document.getElementById("remix-output");

// Global variable to store the current recipe data
let currentRecipeData = null;

// This function creates a list of ingredients for the recipe from the API data
// It loops through the ingredients and measures, up to 20, and returns an HTML string
// that can be used to display them in a list format
// If an ingredient is empty or just whitespace, it skips that item 
function getIngredientsHtml(recipe) {
  let html = "";
  for (let i = 1; i <= 20; i++) {
    const ing = recipe[`strIngredient${i}`];
    const meas = recipe[`strMeasure${i}`];
    if (ing && ing.trim()) html += `<li>${meas ? `${meas} ` : ""}${ing}</li>`;
  }
  return html;
}

// This function displays the recipe on the page
function renderRecipe(recipe) {
  // Store the current recipe data globally so we can use it for remixing
  currentRecipeData = recipe;
  
  recipeDisplay.innerHTML = `
    <div class="recipe-title-row">
      <h2>${recipe.strMeal}</h2>
    </div>
    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" />
    <h3>Ingredients:</h3>
    <ul>${getIngredientsHtml(recipe)}</ul>
    <h3>Instructions:</h3>
    <p>${recipe.strInstructions.replace(/\r?\n/g, "<br>")}</p>
  `;
}

// This function gets a random recipe from the API and shows it
async function fetchAndDisplayRandomRecipe() {
  recipeDisplay.innerHTML = "<p>Loading...</p>"; // Show loading message
  try {
    // Fetch a random recipe from the MealDB API
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php'); // Correct API URL for random recipe
    const data = await res.json(); // Parse the JSON response
    const recipe = data.meals[0]; // Get the first recipe from the response
    renderRecipe(recipe); // Fixed missing semicolon
  } catch (error) {
    recipeDisplay.innerHTML = "<p>Sorry, couldn't load a recipe.</p>";
  }
}

// This function sends the current recipe and remix theme to OpenAI for a creative remix
async function remixRecipe() {
  // Make sure we have a current recipe to remix
  if (!currentRecipeData) {
    remixOutput.innerHTML = "<p>Please load a recipe first before remixing!</p>";
    return;
  }

  // Get the selected remix theme
  const selectedTheme = remixThemeSelect.value;
  
  // Show loading message
  remixOutput.innerHTML = "<p>🎨 Creating your remix masterpiece...</p>";
  
  try {
    // Prepare the recipe data for OpenAI
    const recipeText = `Recipe: ${currentRecipeData.strMeal}
Ingredients: ${getIngredientsText(currentRecipeData)}
Instructions: ${currentRecipeData.strInstructions}`;

    // Send request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a creative chef who loves to remix recipes. Give short, fun, creative, and totally doable recipe remixes. Highlight any changed ingredients or cooking instructions. Keep responses under 300 words.'
          },
          {
            role: 'user',
            content: `Please remix this recipe with the theme: "${selectedTheme}"\n\n${recipeText}`
          }
        ],
        max_tokens: 400,
        temperature: 0.8
      })
    });

    // Check if the API request was successful
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // Parse the response
    const data = await response.json();
    const remixedRecipe = data.choices[0].message.content;

    // Display the remixed recipe
    remixOutput.innerHTML = `
      <div class="remix-result">
        <h3>🎨 Your Remixed Recipe: ${selectedTheme}</h3>
        <div class="remix-content">
          ${remixedRecipe.replace(/\n/g, '<br>')}
        </div>
      </div>
    `;
    
  } catch (error) {
    // Show friendly error message
    remixOutput.innerHTML = `
      <p>Oops! Something went wrong while creating your remix. Please try again!</p>
      <p><small>Error: ${error.message}</small></p>
    `;
  }
}

// Helper function to get ingredients as plain text for OpenAI
function getIngredientsText(recipe) {
  let ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing = recipe[`strIngredient${i}`];
    const meas = recipe[`strMeasure${i}`];
    if (ing && ing.trim()) {
      ingredients.push(`${meas ? `${meas} ` : ""}${ing}`);
    }
  }
  return ingredients.join(', ');
}


// --- Event listeners ---

// When the button is clicked, get and show a new random recipe
randomBtn.addEventListener("click", fetchAndDisplayRandomRecipe);

// When the remix button is clicked, remix the current recipe
remixBtn.addEventListener("click", remixRecipe);

// When the page loads, show a random recipe right away
document.addEventListener("DOMContentLoaded", fetchAndDisplayRandomRecipe);